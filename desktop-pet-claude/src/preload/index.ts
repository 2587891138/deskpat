import { contextBridge, ipcRenderer } from 'electron'

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

const api: ElectronAPI = {
  sendMessage: (conversationId, content) =>
    ipcRenderer.invoke('chat:send', conversationId, content),

  stopGeneration: () => ipcRenderer.invoke('chat:stop'),

  openChatWindow: () => ipcRenderer.invoke('chat:openWindow'),

  getConversations: () => ipcRenderer.invoke('chat:getConversations'),

  getMessages: (conversationId) => ipcRenderer.invoke('chat:getMessages', conversationId),

  createConversation: (title) => ipcRenderer.invoke('chat:createConversation', title),

  onChunk: (callback) => {
    const handler = (_event: Electron.IpcRendererEvent, chunk: string) => callback(chunk)
    ipcRenderer.on('chat:chunk', handler)
    return () => ipcRenderer.removeListener('chat:chunk', handler)
  },

  onChatDone: (callback) => {
    const handler = () => callback()
    ipcRenderer.on('chat:done', handler)
    return () => ipcRenderer.removeListener('chat:done', handler)
  },

  onChatError: (callback) => {
    const handler = (_event: Electron.IpcRendererEvent, error: string) => callback(error)
    ipcRenderer.on('chat:error', handler)
    return () => ipcRenderer.removeListener('chat:error', handler)
  },

  onPetThinking: (callback) => {
    const handler = () => callback()
    ipcRenderer.on('pet:thinking', handler)
    return () => ipcRenderer.removeListener('pet:thinking', handler)
  },

  notifyThinking: () => ipcRenderer.invoke('pet:thinking'),
  moveWindow: (dx: number, dy: number) => ipcRenderer.send('window:move', dx, dy),
  quitApp: () => ipcRenderer.invoke('app:quit')
}

contextBridge.exposeInMainWorld('electronAPI', api)