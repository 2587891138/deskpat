import { create } from 'zustand'

export interface Message {
  id: number
  conversation_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: number
}

export interface Conversation {
  id: string
  title: string
  created_at: number
  updated_at: number
}

interface ConversationState {
  conversations: Conversation[]
  currentId: string | null
  messages: Message[]
  isLoading: boolean
  streamingContent: string

  setConversations: (convs: Conversation[]) => void
  setCurrentId: (id: string) => void
  setMessages: (msgs: Message[]) => void
  setIsLoading: (v: boolean) => void
  appendStreamChunk: (chunk: string) => void
  commitStreamed: () => void
  addUserMessage: (content: string) => void
  createConversation: (title: string) => Promise<Conversation>
  loadConversation: (id: string) => Promise<void>
  sendMessage: (content: string) => Promise<void>
}

export const useConversationStore = create<ConversationState>((set, get) => ({
  conversations: [],
  currentId: null,
  messages: [],
  isLoading: false,
  streamingContent: '',

  setConversations: (convs) => set({ conversations: convs }),

  setCurrentId: (id) => set({ currentId: id }),

  setMessages: (msgs) => set({ messages: msgs }),

  setIsLoading: (v) => set({ isLoading: v }),

  appendStreamChunk: (chunk) =>
    set((s) => ({ streamingContent: s.streamingContent + chunk })),

  commitStreamed: () => {
    const { streamingContent, messages } = get()
    if (!streamingContent) return
    const aiMsg: Message = {
      id: Date.now(),
      conversation_id: get().currentId || '',
      role: 'assistant',
      content: streamingContent,
      created_at: Date.now()
    }
    set({ messages: [...messages, aiMsg], streamingContent: '' })
  },

  addUserMessage: (content) => {
    const userMsg: Message = {
      id: Date.now(),
      conversation_id: get().currentId || '',
      role: 'user',
      content,
      created_at: Date.now()
    }
    set((s) => ({ messages: [...s.messages, userMsg] }))
  },

  createConversation: async (title) => {
    const conv = await window.electronAPI.createConversation(title)
    set((s) => ({ conversations: [conv, ...s.conversations] }))
    return conv
  },

  loadConversation: async (id) => {
    set({ currentId: id, messages: [], streamingContent: '' })
    const msgs = await window.electronAPI.getMessages(id)
    set({ messages: msgs })
  },

  sendMessage: async (content) => {
    const { currentId, addUserMessage, appendStreamChunk, commitStreamed } = get()
    if (!currentId || !content.trim()) return

    addUserMessage(content)
    set({ isLoading: true, streamingContent: '' })

    // 注册流式回调
    const unsubChunk = window.electronAPI.onChunk((chunk) => {
      appendStreamChunk(chunk)
    })
    const unsubDone = window.electronAPI.onChatDone(() => {
      commitStreamed()
      set({ isLoading: false })
      unsubChunk()
      unsubDone()
      unsubError()
    })
    const unsubError = window.electronAPI.onChatError((err) => {
      appendStreamChunk(`\n\n[错误: ${err}]`)
      commitStreamed()
      set({ isLoading: false })
      unsubChunk()
      unsubDone()
      unsubError()
    })

    await window.electronAPI.sendMessage(currentId, content)
  }
}))