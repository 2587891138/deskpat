/**
 * 雪豹桌面宠物渲染器 — 基于"飞行雪绒"项目的形象与运动逻辑
 *
 * 动画状态（7种，对应原始 GIF）：
 *   idle    - 待机（呼吸 + 尾巴轻摆）
 *   moving  - 移动（四肢交替迈步）
 *   jumping - 跳跃（四肢收拢 + 抛物线）
 *   boring  - 无聊（趴下打哈欠）
 *   happy   - 开心（摇头晃脑 + 尾巴快速摆）
 *   play    - 玩耍（原地打滚）
 *   wave    - 挥手（抬起前爪摆动）
 *
 * 运动物理（匹配 config_animation.py）：
 *   60 FPS 物理帧、16 FPS 动画帧
 *   速度 1.0→2.0 px/frame、加速度 0.1 px/frame²
 *   跳跃：水平 5.0、垂直 -13.0、空气阻力 0.95
 */
export class PetRenderer {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private animId = 0
  private time = 0

  // 动画状态机
  private state: AnimationState = 'idle'
  private stateTimer = 0
  private animFrame = 0
  private animFrameTimer = 0
  private readonly ANIM_FPS = 16
  private readonly PHYSICS_FPS = 60

  // 运动物理
  private x = 0
  private y = 0
  private vx = 0
  private vy = 0
  private onGround = true
  private facingRight = true

  // 自动行为
  private autoBehaviorTimer = 0
  private autoBehaviorInterval = 10 + Math.random() * 10 // 10~20秒

  // 漫游
  private wanderTimer = 0
  private readonly WANDER_INTERVAL = 5

  // 眨眼
  private blinkTimer = 0
  private isBlinking = false

  // 交互
  private thinking = false
  private clickAnimTimer = 0

  // === 颜色（匹配飞行雪绒配色） ===
  private readonly colors = {
    fur: '#F0EDE8',       // 雪豹灰白毛色
    furDark: '#D5CFC6',   // 暗面毛色
    spots: '#5A564F',     // 蔷薇斑纹
    spotDark: '#3D3A35',  // 深色斑纹
    nose: '#E8918B',      // 鼻头粉色
    eye: '#7BA4A8',       // 蓝灰瞳色
    eyePupil: '#2C3E50',  // 瞳孔深色
    innerEar: '#F5C6C6',  // 内耳粉色
    tailTip: '#3D3A35',   // 尾尖深色
    pawPad: '#E8B4B8',    // 肉垫粉色
    tongue: '#F2A0A0'     // 舌头粉色
  }

  // 各动画帧数
  private readonly FRAMES: Record<AnimationState, number> = {
    idle: 4, moving: 6, jumping: 1, boring: 6, happy: 4, play: 6, wave: 4
  }

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.resize()
    window.addEventListener('resize', () => this.resize())
  }

  private resize(): void {
    const dpr = window.devicePixelRatio || 1
    const rect = this.canvas.getBoundingClientRect()
    this.canvas.width = rect.width * dpr
    this.canvas.height = rect.height * dpr
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  start(): void {
    // 初始位置：窗口中心偏下
    const w = this.canvas.width / (window.devicePixelRatio || 1)
    const h = this.canvas.height / (window.devicePixelRatio || 1)
    this.x = w / 2
    this.y = h * 0.75

    let lastTime = 0
    const loop = (t: number) => {
      const dt = lastTime ? (t - lastTime) / 1000 : 0.016
      lastTime = t
      this.time += dt
      this.update(dt)
      this.draw()
      this.animId = requestAnimationFrame(loop)
    }
    this.animId = requestAnimationFrame(loop)
  }

  stop(): void {
    cancelAnimationFrame(this.animId)
  }

  onClick(): void {
    this.clickAnimTimer = 0.5
    this.setState('happy')
  }

  setThinking(v: boolean): void {
    this.thinking = v
    if (v) this.setState('wave')
    else this.setState('idle')
  }

  private setState(s: AnimationState): void {
    if (this.state === s) return
    this.state = s
    this.stateTimer = 0
    this.animFrame = 0
    this.animFrameTimer = 0
  }

  // ========== 更新循环 ==========

  private update(dt: number): void {
    // 眨眼
    this.blinkTimer += dt
    if (!this.isBlinking && this.blinkTimer > 3 + Math.random() * 2) {
      this.isBlinking = true
      this.blinkTimer = 0
    }
    if (this.isBlinking && this.blinkTimer > 0.15) {
      this.isBlinking = false
      this.blinkTimer = 0
    }

    // 点击动画衰减
    if (this.clickAnimTimer > 0) this.clickAnimTimer = Math.max(0, this.clickAnimTimer - dt)

    // 动画帧更新（16 FPS）
    this.animFrameTimer += dt
    const frameInterval = 1 / this.ANIM_FPS
    if (this.animFrameTimer >= frameInterval) {
      this.animFrameTimer -= frameInterval
      this.animFrame = (this.animFrame + 1) % this.FRAMES[this.state]
    }

    // 状态计时
    this.stateTimer += dt

    // 物理更新（60 FPS 逻辑）
    this.updatePhysics(dt)

    // 自动行为
    if (!this.thinking) this.updateAutoBehavior(dt)
  }

  private updatePhysics(dt: number): void {
    const subSteps = Math.ceil(dt * this.PHYSICS_FPS)
    const subDt = 1 / this.PHYSICS_FPS

    for (let i = 0; i < subSteps; i++) {
      // 重力
      if (!this.onGround) {
        this.vy += 0.5 // 重力加速度
        this.vy *= 0.95 // 空气阻力
      }

      // 水平速度衰减（摩擦力）
      if (this.onGround && this.state !== 'moving') {
        this.vx *= 0.9
        if (Math.abs(this.vx) < 0.5) this.vx = 0
      }

      // 位置更新
      this.x += this.vx
      this.y += this.vy

      // 地面碰撞
      const h = this.canvas.height / (window.devicePixelRatio || 1)
      const groundY = h * 0.75
      if (this.y >= groundY) {
        this.y = groundY
        this.vy = 0

        // 落地弹跳
        if (!this.onGround && this.state === 'jumping') {
          this.vy = -Math.abs(this.vy) * 0.3 // 小反弹
          if (Math.abs(this.vy) < 2) this.vy = 0
        } else {
          this.onGround = true
          if (this.state === 'jumping') this.setState('idle')
        }
      }

      // 水平边界（窗口内弹回）
      const w = this.canvas.width / (window.devicePixelRatio || 1)
      const margin = 60
      if (this.x < margin) { this.x = margin; this.vx *= -0.5; this.facingRight = true }
      if (this.x > w - margin) { this.x = w - margin; this.vx *= -0.5; this.facingRight = false }
    }

    // 移动动画自动调整朝向
    if (this.state === 'moving') {
      if (this.vx > 0.3) this.facingRight = true
      else if (this.vx < -0.3) this.facingRight = false
    }
  }

  private updateAutoBehavior(dt: number): void {
    // 漫游
    this.wanderTimer += dt
    if (this.wanderTimer >= this.WANDER_INTERVAL && this.state === 'idle') {
      this.wanderTimer = 0
      this.startWander()
    }

    // 随机状态切换
    this.autoBehaviorTimer += dt
    if (this.autoBehaviorTimer >= this.autoBehaviorInterval && this.onGround) {
      this.autoBehaviorTimer = 0
      this.autoBehaviorInterval = 10 + Math.random() * 10

      const states: AnimationState[] = ['boring', 'happy', 'wave', 'play', 'jumping']
      const pick = states[Math.floor(Math.random() * states.length)]
      this.setState(pick)

      // 非持续状态 3 秒后回 idle
      if (pick !== 'moving') {
        setTimeout(() => {
          if (this.state === pick && !this.thinking) this.setState('idle')
        }, 3000)
      }
    }
  }

  private startWander(): void {
    this.setState('moving')
    const w = this.canvas.width / (window.devicePixelRatio || 1)
    const targetX = 60 + Math.random() * (w - 120)
    const dx = targetX - this.x
    this.vx = Math.sign(dx) * 1.0 // 起步速度
    // 加速到最大速度
    const accel = 0.1
    const maxSpeed = 2.0
    const targetVx = Math.sign(dx) * Math.min(maxSpeed, Math.abs(dx) / 50)
    const accelerate = setInterval(() => {
      if (this.state !== 'moving') { clearInterval(accelerate); return }
      if (Math.abs(this.vx) < Math.abs(targetVx)) {
        this.vx += Math.sign(targetVx) * accel
      }
    }, 1000 / this.PHYSICS_FPS)

    // 到达目的地后回 idle
    const checkArrival = setInterval(() => {
      if (this.state !== 'moving') { clearInterval(checkArrival); clearInterval(accelerate); return }
      if (Math.abs(this.x - targetX) < 10) {
        this.vx = 0
        this.setState('idle')
        clearInterval(checkArrival)
        clearInterval(accelerate)
      }
    }, 100)
  }

  // ========== 绘制 ==========

  private draw(): void {
    const { ctx } = this
    const w = this.canvas.width / (window.devicePixelRatio || 1)
    const h = this.canvas.height / (window.devicePixelRatio || 1)

    ctx.clearRect(0, 0, w, h)

    // 思考气泡
    if (this.thinking) {
      this.drawThinkingBubbles(ctx, this.x, this.y - 100)
    }

    ctx.save()

    // 水平翻转
    const scaleX = this.facingRight ? 1 : -1
    ctx.translate(this.x, this.y)
    ctx.scale(scaleX, 1)

    // 身体动画偏移
    const bodyBob = this.getBodyBob()
    ctx.translate(0, bodyBob)

    // 绘制雪豹
    this.drawSnowLeopard(ctx)

    ctx.restore()

    // 粒子效果（点击时粉色散落）
    if (this.clickAnimTimer > 0) {
      this.drawClickParticles(ctx)
    }
  }

  private getBodyBob(): number {
    const t = this.time
    switch (this.state) {
      case 'idle': return Math.sin(t * 2.5) * 1.5
      case 'moving': return Math.abs(Math.sin(this.animFrame / this.FRAMES.moving * Math.PI)) * 3
      case 'jumping': return 0
      case 'boring': return Math.sin(t * 1.5) * 1
      case 'happy': return Math.sin(t * 6) * 3
      case 'play': return Math.sin(t * 8) * 4
      case 'wave': return Math.sin(t * 2) * 1
      default: return 0
    }
  }

  private drawSnowLeopard(ctx: CanvasRenderingContext2D): void {
    const s = this.getStateShift()
    ctx.save()
    ctx.translate(s.sx, s.sy)
    ctx.rotate(s.rot)

    this.drawTail(ctx)
    this.drawLegs(ctx)
    this.drawBody(ctx)
    this.drawHead(ctx)

    ctx.restore()
  }

  // 各状态下的变形参数
  private getStateShift(): { sx: number; sy: number; rot: number } {
    const frame = this.animFrame
    const total = this.FRAMES[this.state]
    const p = total > 1 ? frame / (total - 1) : 0.5

    switch (this.state) {
      case 'moving': return {
        sx: 0,
        sy: Math.sin(p * Math.PI * 2) * 3,
        rot: Math.sin(p * Math.PI * 2) * 0.05
      }
      case 'jumping': return { sx: 0, sy: 0, rot: -0.1 }
      case 'happy': return {
        sx: Math.sin(p * Math.PI * 2) * 5,
        sy: Math.abs(Math.sin(p * Math.PI * 2)) * 4,
        rot: Math.sin(p * Math.PI * 2) * 0.1
      }
      case 'play': return {
        sx: 0,
        sy: Math.abs(Math.cos(p * Math.PI)) * 6,
        rot: (p - 0.5) * 0.6
      }
      case 'wave': return {
        sx: 0,
        sy: 0,
        rot: Math.sin(this.time * 6) * 0.05
      }
      default: return { sx: 0, sy: 0, rot: 0 }
    }
  }

  // === 尾巴 ===
  private drawTail(ctx: CanvasRenderingContext2D): void {
    ctx.save()

    const tailLen = 55
    const tailBaseX = -10
    const tailBaseY = 10

    // 尾巴摆动角度
    let tailAngle = Math.sin(this.time * 2) * 0.3
    if (this.state === 'happy') tailAngle = Math.sin(this.time * 8) * 0.5
    if (this.state === 'wave') tailAngle = Math.sin(this.time * 6 + 1) * 0.4

    ctx.translate(tailBaseX, tailBaseY)
    ctx.rotate(-0.4 + tailAngle)

    // 尾巴主体（粗到细）
    ctx.fillStyle = this.colors.fur
    ctx.beginPath()
    ctx.moveTo(0, 5)
    ctx.quadraticCurveTo(-20, 0, -tailLen, -15)
    ctx.quadraticCurveTo(-tailLen - 5, -12, -tailLen, -10)
    ctx.quadraticCurveTo(-20, 8, 0, -5)
    ctx.closePath()
    ctx.fill()

    // 尾巴暗面
    ctx.fillStyle = this.colors.furDark
    ctx.beginPath()
    ctx.moveTo(0, 5)
    ctx.quadraticCurveTo(-15, 3, -tailLen, -10)
    ctx.quadraticCurveTo(-15, 6, 0, -5)
    ctx.closePath()
    ctx.fill()

    // 尾巴环纹
    ctx.strokeStyle = this.colors.spots
    ctx.lineWidth = 3
    for (let i = 0; i < 3; i++) {
      const t = 0.3 + i * 0.2
      const rx = -tailLen * t
      const ry = 2 - 15 * t
      ctx.beginPath()
      ctx.arc(rx, ry, 5 + (1 - t) * 3, 0, Math.PI * 2)
      ctx.stroke()
    }

    // 尾尖
    ctx.fillStyle = this.colors.tailTip
    ctx.beginPath()
    ctx.arc(-tailLen, -12, 6, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()
  }

  // === 四肢 ===
  private drawLegs(ctx: CanvasRenderingContext2D): void {
    const t = this.time
    const fp = this.animFrame / Math.max(1, this.FRAMES[this.state] - 1)

    // 前腿
    this.drawLeg(ctx, -18, 20, 16, this.getLegAngle(fp, true, 0))
    this.drawLeg(ctx, 8, 20, 16, this.getLegAngle(fp, true, 0.5))
    // 后腿
    this.drawLeg(ctx, -22, 32, 14, this.getLegAngle(fp, false, 0.25))
    this.drawLeg(ctx, 4, 32, 14, this.getLegAngle(fp, false, 0.75))

    // 趴下时腿收拢
    if (this.state === 'boring') {
      ctx.fillStyle = this.colors.furDark
      ctx.beginPath()
      ctx.ellipse(-16, 34, 14, 6, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.ellipse(10, 34, 14, 6, 0, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  private drawLeg(ctx: CanvasRenderingContext2D, bx: number, by: number, len: number, angle: number): void {
    ctx.save()
    ctx.translate(bx, by)
    ctx.rotate(angle)

    // 腿部
    ctx.fillStyle = this.colors.fur
    ctx.beginPath()
    ctx.roundRect(-6, 0, 12, len, 5)
    ctx.fill()

    // 足部
    ctx.fillStyle = this.colors.fur
    ctx.beginPath()
    ctx.ellipse(0, len, 8, 5, 0, 0, Math.PI * 2)
    ctx.fill()

    // 肉垫
    ctx.fillStyle = this.colors.pawPad
    ctx.beginPath()
    ctx.ellipse(0, len + 1, 4, 3, 0, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()
  }

  private getLegAngle(fp: number, isFront: boolean, phase: number): number {
    switch (this.state) {
      case 'moving':
        return Math.sin((fp + phase) * Math.PI * 2) * (isFront ? 0.35 : 0.3)
      case 'jumping':
        return isFront ? 0.3 : -0.2
      case 'happy':
        return Math.sin((fp + phase) * Math.PI * 2) * 0.2
      default:
        return Math.sin(this.time * 1.5 + phase * Math.PI) * 0.03
    }
  }

  // === 身体 ===
  private drawBody(ctx: CanvasRenderingContext2D): void {
    // 身体主体
    ctx.fillStyle = this.colors.fur
    ctx.beginPath()
    ctx.ellipse(0, 15, 30, 22, 0, 0, Math.PI * 2)
    ctx.fill()

    // 腹部浅色
    ctx.fillStyle = '#FFFFFF'
    ctx.beginPath()
    ctx.ellipse(2, 20, 20, 14, 0.1, 0, Math.PI * 2)
    ctx.fill()

    // 背部暗面
    ctx.fillStyle = this.colors.furDark
    ctx.beginPath()
    ctx.ellipse(0, 8, 26, 12, 0, Math.PI, Math.PI * 2)
    ctx.fill()

    // 蔷薇斑纹
    this.drawRosettes(ctx, 30, 22)

    // 玩耍时身体略旋转
    if (this.state === 'play') {
      // no extra drawing
    }
  }

  private drawRosettes(ctx: CanvasRenderingContext2D, rx: number, ry: number): void {
    ctx.fillStyle = this.colors.spots
    const spots = [
      { x: -15, y: 5, r: 5 },
      { x: -5, y: 0, r: 4 },
      { x: 10, y: 3, r: 4.5 },
      { x: 20, y: 8, r: 3.5 },
      { x: -18, y: 15, r: 4 },
      { x: 5, y: 12, r: 3 },
      { x: 15, y: 18, r: 4 },
      { x: -8, y: 22, r: 3.5 },
    ]

    for (const s of spots) {
      ctx.beginPath()
      // 画不规则环形斑纹
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
      ctx.fill()
      // 中心亮色
      ctx.fillStyle = this.colors.fur
      ctx.beginPath()
      ctx.arc(s.x, s.y, s.r * 0.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = this.colors.spots
    }
  }

  // === 头部 ===
  private drawHead(ctx: CanvasRenderingContext2D): void {
    ctx.save()
    const headY = -25 + Math.sin(this.time * 2.5) * 1
    ctx.translate(3, headY)

    // 耳朵
    this.drawEar(ctx, -18, -20, -0.3)
    this.drawEar(ctx, 18, -20, 0.3)

    // 头部主体（圆润宽脸）
    ctx.fillStyle = this.colors.fur
    ctx.beginPath()
    ctx.ellipse(0, -5, 26, 24, 0, 0, Math.PI * 2)
    ctx.fill()

    // 面部白色区域
    ctx.fillStyle = '#FFFFFF'
    ctx.beginPath()
    ctx.ellipse(0, 0, 18, 18, 0, 0, Math.PI * 2)
    ctx.fill()

    // 额头斑点
    ctx.fillStyle = this.colors.spotDark
    const headSpots = [
      { x: -8, y: -18, r: 3 },
      { x: 8, y: -18, r: 3 },
      { x: 0, y: -22, r: 2.5 },
      { x: -5, y: -14, r: 2 },
      { x: 5, y: -14, r: 2 },
    ]
    for (const s of headSpots) {
      ctx.beginPath()
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
      ctx.fill()
    }

    // 脸颊两侧毛
    ctx.fillStyle = this.colors.furDark
    ctx.beginPath()
    ctx.ellipse(-20, 2, 8, 14, -0.2, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(20, 2, 8, 14, 0.2, 0, Math.PI * 2)
    ctx.fill()

    // 眼睛
    this.drawEye(ctx, -10, -6)
    this.drawEye(ctx, 10, -6)

    // 鼻子
    ctx.fillStyle = this.colors.nose
    ctx.beginPath()
    ctx.moveTo(0, 4)
    ctx.quadraticCurveTo(-4, 2, -2, -2)
    ctx.lineTo(2, -2)
    ctx.quadraticCurveTo(4, 2, 0, 4)
    ctx.fill()

    // 嘴巴
    ctx.strokeStyle = '#888'
    ctx.lineWidth = 1
    if (this.state === 'boring') {
      // 打哈欠 — 大张嘴
      ctx.fillStyle = this.colors.tongue
      ctx.beginPath()
      ctx.ellipse(0, 12, 8, 6, 0, 0, Math.PI * 2)
      ctx.fill()
    } else if (this.state === 'happy') {
      // 开心 — 咧嘴笑
      ctx.beginPath()
      ctx.arc(0, 8, 6, 0.2, Math.PI - 0.2)
      ctx.stroke()
    } else {
      // 正常嘴
      ctx.beginPath()
      ctx.moveTo(0, 7)
      ctx.quadraticCurveTo(-5, 5, -8, 8)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(0, 7)
      ctx.quadraticCurveTo(5, 5, 8, 8)
      ctx.stroke()
    }

    // 胡须
    ctx.strokeStyle = '#DDD'
    ctx.lineWidth = 0.8
    for (const side of [-1, 1]) {
      const sx = side * 3
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath()
        ctx.moveTo(sx, 6)
        ctx.lineTo(sx + side * 18, 6 + i * 5)
        ctx.stroke()
      }
    }

    // 无聊/思考时的表情变化：半闭眼
    if (this.state === 'boring' || this.thinking) {
      ctx.fillStyle = '#FFF'
      ctx.globalAlpha = 0.5
      ctx.beginPath()
      ctx.arc(-10, -6, 7, 0, Math.PI)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(10, -6, 7, 0, Math.PI)
      ctx.fill()
      ctx.globalAlpha = 1
    }

    ctx.restore()
  }

  private drawEar(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number): void {
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(angle)

    // 外耳
    ctx.fillStyle = this.colors.fur
    ctx.beginPath()
    ctx.moveTo(-8, -12)
    ctx.quadraticCurveTo(0, -22, 8, -12)
    ctx.quadraticCurveTo(0, -4, -8, -12)
    ctx.fill()

    // 内耳
    ctx.fillStyle = this.colors.innerEar
    ctx.beginPath()
    ctx.moveTo(-4, -12)
    ctx.quadraticCurveTo(0, -18, 4, -12)
    ctx.quadraticCurveTo(0, -6, -4, -12)
    ctx.fill()

    ctx.restore()
  }

  private drawEye(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    if (this.isBlinking) {
      ctx.strokeStyle = '#555'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(x - 7, y)
      ctx.lineTo(x + 7, y)
      ctx.stroke()
    } else {
      // 眼眶
      ctx.fillStyle = '#FFF'
      ctx.beginPath()
      ctx.ellipse(x, y, 8, 9, 0, 0, Math.PI * 2)
      ctx.fill()

      // 虹膜
      ctx.fillStyle = this.colors.eye
      ctx.beginPath()
      ctx.ellipse(x, y + 1, 7, 8, 0, 0, Math.PI * 2)
      ctx.fill()

      // 瞳孔（竖椭圆，猫科特征）
      ctx.fillStyle = this.colors.eyePupil
      ctx.beginPath()
      ctx.ellipse(x, y + 1, 2.5, 6, 0, 0, Math.PI * 2)
      ctx.fill()

      // 高光
      ctx.fillStyle = '#FFF'
      ctx.beginPath()
      ctx.arc(x - 2, y - 3, 3, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(x + 3, y + 3, 1.5, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // === 粒子与气泡 ===

  private drawThinkingBubbles(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
    const t = this.time
    const bubbles = [
      { r: 6, delay: 0 },
      { r: 5, delay: 0.3 },
      { r: 4, delay: 0.6 }
    ]
    for (const b of bubbles) {
      const progress = ((t + b.delay) % 1.5) / 1.5
      const by = cy - progress * 30
      const alpha = 1 - progress
      ctx.fillStyle = `rgba(200,210,220,${alpha * 0.7})`
      ctx.beginPath()
      ctx.arc(cx + 20, by, b.r, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  private drawClickParticles(ctx: CanvasRenderingContext2D): void {
    const count = 12
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2
      const dist = this.clickAnimTimer * 60 * (0.5 + Math.random() * 0.5)
      const alpha = this.clickAnimTimer / 0.5
      const px = this.x + Math.cos(angle) * dist
      const py = this.y + Math.sin(angle) * dist - 20

      // 粉色粒子（匹配飞行雪绒配色）
      ctx.fillStyle = `rgba(255,182,193,${alpha})`
      ctx.beginPath()
      ctx.arc(px, py, 3 + Math.random() * 2, 0, Math.PI * 2)
      ctx.fill()

      // 青色粒子
      ctx.fillStyle = `rgba(173,216,230,${alpha * 0.7})`
      ctx.beginPath()
      ctx.arc(px + 3, py + 3, 2 + Math.random() * 1.5, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

type AnimationState = 'idle' | 'moving' | 'jumping' | 'boring' | 'happy' | 'play' | 'wave'