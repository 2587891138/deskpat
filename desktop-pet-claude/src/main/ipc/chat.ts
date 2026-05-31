import { ipcMain, BrowserWindow } from 'electron'
import { sendMessage, stopGeneration } from '../ai/anthropic'
import {
  getConversations,
  getMessages,
  createConversation,
  saveMessage
} from '../db/repository'

export function registerChatIpc(
  getPetWindow: () => BrowserWindow | null,
  getChatWindow: () => BrowserWindow | null
): void {
  // 发送消息并流式返回
  ipcMain.handle('chat:send', async (_event, conversationId: string, content: string) => {
    const chatWin = getChatWindow()
    if (!chatWin) return

    // 保存用户消息
    saveMessage(conversationId, 'user', content)

    try {
      const chunks: string[] = []
      await sendMessage(conversationId, content, (chunk) => {
        chunks.push(chunk)
        // 流式发送每个文本块到对话窗口
        chatWin.webContents.send('chat:chunk', chunk)
      })

      // 完整回复保存
      const fullReply = chunks.join('')
      saveMessage(conversationId, 'assistant', fullReply)

      // 通知宠物窗口回复完成
      const petWin = getPetWindow()
      if (petWin && !petWin.isDestroyed()) {
        petWin.webContents.send('chat:done')
      }

      return { success: true, reply: fullReply }
    } catch (err: any) {
      const errorMsg = err?.message || '未知错误'
      chatWin.webContents.send('chat:error', errorMsg)
      return { success: false, error: errorMsg }
    }
  })

  // 停止生成
  ipcMain.handle('chat:stop', async () => {
    stopGeneration()
    return { success: true }
  })

  // 打开对话窗口
  ipcMain.handle('chat:openWindow', async () => {
    const chatWin = getChatWindow()
    if (chatWin && !chatWin.isDestroyed()) {
      chatWin.show()
      chatWin.focus()
    }
  })

  // 获取会话列表
  ipcMain.handle('chat:getConversations', async () => {
    return getConversations()
  })

  // 获取会话消息
  ipcMain.handle('chat:getMessages', async (_event, conversationId: string) => {
    return getMessages(conversationId)
  })

  // 创建新会话
  ipcMain.handle('chat:createConversation', async (_event, title: string) => {
    return createConversation(title)
  })

  // 通知宠物窗口思考状态
  ipcMain.handle('pet:thinking', async () => {
    const petWin = getPetWindow()
    if (petWin && !petWin.isDestroyed()) {
      petWin.webContents.send('pet:thinking')
    }
  })

  // 移动宠物窗口
  ipcMain.on('window:move', (_event, dx: number, dy: number) => {
    const petWin = getPetWindow()
    if (petWin && !petWin.isDestroyed()) {
      const [x, y] = petWin.getPosition()
      petWin.setPosition(x + dx, y + dy)
    }
  })

  // 退出应用
  ipcMain.handle('app:quit', async () => {
    const { app } = require('electron')
    app.quit()
  })
}