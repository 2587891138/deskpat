import { BrowserWindow, screen } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'

let chatWindow: BrowserWindow | null = null

export function createChatWindow(): BrowserWindow {
  const { width: screenW, height: screenH } = screen.getPrimaryDisplay().workAreaSize

  chatWindow = new BrowserWindow({
    width: 480,
    height: 680,
    x: Math.round((screenW - 480) / 2),
    y: Math.round((screenH - 680) / 2),
    title: 'AI 对话',
    show: false, // 初始隐藏，点击宠物或快捷键时显示
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    chatWindow.loadURL(process.env['ELECTRON_RENDERER_URL'] + '/chat/index.html')
  } else {
    chatWindow.loadFile(join(__dirname, '../renderer/chat/index.html'))
  }

  // 关闭窗口时隐藏而非退出
  chatWindow.on('close', (e) => {
    e.preventDefault()
    chatWindow?.hide()
  })

  return chatWindow
}

export function getChatWindow(): BrowserWindow | null {
  return chatWindow
}

export function toggleChatWindow(): void {
  if (!chatWindow || chatWindow.isDestroyed()) return
  if (chatWindow.isVisible()) {
    chatWindow.hide()
  } else {
    chatWindow.show()
    chatWindow.focus()
  }
}

export function showChatWindow(): void {
  if (!chatWindow || chatWindow.isDestroyed()) return
  chatWindow.show()
  chatWindow.focus()
}