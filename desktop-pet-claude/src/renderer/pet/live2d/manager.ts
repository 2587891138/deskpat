/**
 * Live2D 模型管理器（待集成）
 *
 * 集成步骤：
 * 1. 从 https://www.live2d.com/download/cubism-sdk/download-web/ 下载 Cubism SDK for Web
 * 2. 将 Core 库文件放到 src/renderer/pet/live2d/core/
 * 3. 将 Framework 文件放到 src/renderer/pet/live2d/framework/
 * 4. 将模型文件放到 assets/models/
 * 5. 取消下面的注释并实现加载逻辑
 *
 * 当前使用 PetRenderer（Canvas 2D 手绘）作为临时方案
 */
export class Live2DManager {
  private canvas: HTMLCanvasElement | null = null
  private loaded = false

  async init(canvas: HTMLCanvasElement): Promise<void> {
    this.canvas = canvas
    // TODO: 初始化 Live2D Cubism SDK
    // 1. 加载 Cubism Core WebAssembly
    // 2. 初始化 Framework
    // 3. 加载模型文件（.model3.json）
    // 4. 绑定到 Canvas 并启动渲染循环
    this.loaded = false
    console.log('Live2D 集成待完成，当前使用 Canvas 2D 渲染')
  }

  setAnimation(state: 'idle' | 'thinking' | 'react'): void {
    if (!this.loaded) return
    // TODO: 切换 Live2D 动作
    // 通过 CubismMotionManager 触发对应 motion
  }

  destroy(): void {
    // TODO: 释放 Live2D 资源
    this.canvas = null
    this.loaded = false
  }
}