export interface ElectronAPI {
  sendMessage: (conversationId: string, content: string) => Promise<{ success: boolean; reply?: string; error?: string }>
  stopGeneration: () => Promise<void>
  openChatWindow: () => Promise<void>
  getConversations: () => Promise<Array<{
    id: string
    title: string
    created_at: number
    updated_at: number
  }>>
  getMessages: (conversationId: string) => Promise<Array<{
    id: number
    conversation_id: string
    role: 'user' | 'assistant'
    content: string
    created_at: number
  }>>
  createConversation: (title: string) => Promise<{
    id: string
    title: string
    created_at: number
    updated_at: number
  }>
  onChunk: (callback: (chunk: string) => void) => () => void
  onChatDone: (callback: () => void) => () => void
  onChatError: (callback: (error: string) => void) => () => void
  onPetThinking: (callback: () => void) => () => void
  notifyThinking: () => Promise<void>
  moveWindow: (dx: number, dy: number) => void
  quitApp: () => Promise<void>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}