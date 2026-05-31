import { BrowserWindow } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'

let petWindow: BrowserWindow | null = null

export function createPetWindow(): BrowserWindow {
  petWindow = new BrowserWindow({
    width: 400,
    height: 500,
    x: 0, // 将在 ready-to-show 时动态设置位置
    y: 0,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    hasShadow: false,
    resizable: false,
    skipTaskbar: true,
    type: 'toolbar', // Linux 上需要
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  // 设置窗口位置到屏幕右下角
  petWindow.once('ready-to-show', () => {
    const { screen } = require('electron')
    const primaryDisplay = screen.getPrimaryDisplay()
    const { width, height } = primaryDisplay.workAreaSize
    const [winW, winH] = petWindow!.getSize()
    petWindow!.setPosition(width - winW - 20, height - winH - 20)
    petWindow!.show()
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    petWindow.loadURL(process.env['ELECTRON_RENDERER_URL'] + '/pet/index.html')
  } else {
    petWindow.loadFile(join(__dirname, '../renderer/pet/index.html'))
  }

  // 阻止窗口被意外关闭，改为隐藏
  petWindow.on('close', (e) => {
    e.preventDefault()
    petWindow?.hide()
  })

  return petWindow
}

export function getPetWindow(): BrowserWindow | null {
  return petWindow
}