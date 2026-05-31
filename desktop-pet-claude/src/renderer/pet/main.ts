import { PetRenderer } from './petRenderer'

const canvas = document.getElementById('pet-canvas') as HTMLCanvasElement
const pet = new PetRenderer(canvas)

let isDragging = false
let hasMoved = false
let lastMouseX = 0
let lastMouseY = 0
const DRAG_THRESHOLD = 4

canvas.addEventListener('mousedown', (e) => {
  lastMouseX = e.screenX
  lastMouseY = e.screenY
  isDragging = true
  hasMoved = false
})

window.addEventListener('mousemove', (e) => {
  if (!isDragging) return
  const dx = e.screenX - lastMouseX
  const dy = e.screenY - lastMouseY
  if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
    hasMoved = true
    window.electronAPI.moveWindow(dx, dy)
    lastMouseX = e.screenX
    lastMouseY = e.screenY
  }
})

window.addEventListener('mouseup', () => {
  if (isDragging && !hasMoved) {
    // 点击（未拖拽）→ 打开对话窗口
    pet.onClick()
    window.electronAPI.openChatWindow()
  }
  isDragging = false
})

// 右键菜单
let contextMenu: HTMLDivElement | null = null

function showContextMenu(x: number, y: number): void {
  hideContextMenu()

  const menu = document.createElement('div')
  menu.className = 'context-menu'
  menu.innerHTML = `
    <div class="menu-item" data-action="chat">打开对话</div>
    <div class="menu-item menu-item-danger" data-action="quit">退出</div>
  `
  menu.style.cssText = `
    position: fixed;
    left: ${x}px;
    top: ${y}px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.15);
    padding: 4px;
    z-index: 9999;
    min-width: 120px;
  `
  const itemStyle = `
    padding: 8px 14px;
    cursor: pointer;
    border-radius: 6px;
    font-size: 13px;
    color: #333;
    font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif;
  `
  menu.querySelectorAll('.menu-item').forEach((el) => {
    ;(el as HTMLElement).style.cssText = itemStyle
  })
  const dangerItem = menu.querySelector('.menu-item-danger') as HTMLElement
  if (dangerItem) {
    dangerItem.style.color = '#e74c3c'
  }

  menu.addEventListener('click', (e) => {
    const target = e.target as HTMLElement
    const action = target.dataset.action
    if (action === 'chat') {
      window.electronAPI.openChatWindow()
    } else if (action === 'quit') {
      window.electronAPI.quitApp()
    }
    hideContextMenu()
  })

  document.body.appendChild(menu)
  contextMenu = menu

  // 点击其他地方关闭菜单
  setTimeout(() => {
    document.addEventListener('click', hideContextMenu, { once: true })
  }, 0)
}

function hideContextMenu(): void {
  if (contextMenu) {
    contextMenu.remove()
    contextMenu = null
  }
}

canvas.addEventListener('contextmenu', (e) => {
  e.preventDefault()
  showContextMenu(e.clientX, e.clientY)
})

// 接收思考状态
window.electronAPI.onPetThinking(() => {
  pet.setThinking(true)
})

// 接收回复完成
window.electronAPI.onChatDone(() => {
  pet.setThinking(false)
})

// 启动动画
pet.start()