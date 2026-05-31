import { app, BrowserWindow, globalShortcut } from 'electron'
import { createPetWindow } from './windows/petWindow'
import { createChatWindow } from './windows/chatWindow'
import { registerChatIpc } from './ipc/chat'
import { initDatabase } from './db/connection'

let petWindow: BrowserWindow | null = null
let chatWindow: BrowserWindow | null = null

function bootstrap(): void {
  initDatabase()
  registerChatIpc(() => petWindow, () => chatWindow)

  petWindow = createPetWindow()
  chatWindow = createChatWindow()

  // 全局快捷键：Ctrl+Shift+C 切换对话窗口
  globalShortcut.register('CommandOrControl+Shift+C', () => {
    if (chatWindow && !chatWindow.isDestroyed()) {
      if (chatWindow.isVisible()) {
        chatWindow.hide()
      } else {
        chatWindow.show()
        chatWindow.focus()
      }
    }
  })
}

app.whenReady().then(bootstrap)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

// macOS: 点击 dock 图标重新创建窗口
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    petWindow = createPetWindow()
    chatWindow = createChatWindow()
  }
})