# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 常用命令

```bash
npm run dev          # 启动开发模式（Electron + Vite HMR）
npm run build        # 生产构建
npm run typecheck    # 类型检查（主进程 + 渲染进程）
```

**注意：** `npm run dev` 以 Electron 窗口形式运行，需在桌面环境中执行。

## 运行环境配置

- Electron 35.x（Node.js v22 内核），开发环境使用 Node.js v24
- 原生模块（`better-sqlite3`）需要针对 Electron 的 Node 版本重新编译：
  ```bash
  npx electron-rebuild -f -w better-sqlite3
  ```
- 使用 AI 对话需设置环境变量 `ANTHROPIC_API_KEY`

## 架构概览

项目基于 **electron-vite** 三进程架构，双窗口设计：

```
主进程 (src/main/)         → 窗口管理、IPC 桥接、Anthropic API、SQLite
预加载 (src/preload/)      → contextBridge 暴露安全 API 给渲染进程
渲染进程 (src/renderer/)
  ├── pet/                 → 宠物悬浮窗口（vanilla TS + Canvas 2D）
  └── chat/                → 对话窗口（React + zustand）
```

### 通信链路

```
渲染进程 → ipcRenderer.invoke → 预加载桥接 → ipcMain.handle → 主进程
主进程   → webContents.send   → 预加载桥接 → ipcRenderer.on  → 渲染进程
```

- 所有 IPC 通过 `contextBridge` 暴露为 `window.electronAPI`
- 流式 AI 回复通过 `chat:chunk` 事件逐块推送到对话窗口
- 宠物窗口与对话窗口通过主进程中转联动（点击宠物→打开对话，发消息→宠物思考动画）

### 数据存储

SQLite 单文件数据库（`userData/conversations.db`），两张表：
- `conversations` — 会话列表
- `messages` — 消息记录（按 `conversation_id` + `created_at` 索引）

### 宠物渲染

当前使用 Canvas 2D 手绘角色（`src/renderer/pet/petRenderer.ts`）。预留了 Live2D 集成入口（`src/renderer/pet/live2d/manager.ts`），待获取 Live2D Cubism SDK for Web 后替换。

## 关键约定

- 所有代码、注释、提交信息使用**简体中文**
- 宠物窗口为 frameless + transparent + alwaysOnTop，关闭时隐藏而非退出
- 右键宠物显示菜单（打开对话 / 退出），退出选项调用 `app.quit()` 彻底关闭
- 对话窗口关闭时也隐藏，不退出应用
- 全局快捷键 `Ctrl+Shift+C` 切换对话窗口显隐