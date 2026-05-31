# CLAUDE.md — 飞行雪绒 2.0

## 项目概述

飞行雪绒是 Windows 桌面宠物应用，基于 PyQt5。核心功能：桌宠展示、AI 伴聊、语音播报/识别、音乐播放、场景对象与粒子特效。

- **版本**: 2.0
- **入口**: `启动程序.bat` → `pythonw lib/core/qt_desktop_pet.py` → `lib/script/main.py`
- **Python**: 3.10+ (当前环境 3.14)
- **远程仓库**: https://github.com/2587891138/deskpat (私有)

## 项目结构

| 路径 | 说明 |
|------|------|
| `config/` | 运行配置、版本信息、共享存储 |
| `lib/core/` | 基础设施：事件中心、窗口、粒子、物理、声音核心 |
| `lib/script/main.py` | 应用生命周期编排 |
| `lib/script/chat/` | AI 对话 (OpenAI/Ollama/元宝) |
| `lib/script/music/` | 多源音乐服务 (QQ/网易云/酷狗) |
| `lib/script/gsvmove/` | GSV 文本转语音 |
| `lib/script/microphone_stt/` | Vosk 语音识别 |
| `lib/script/ui/` | UI 组件 (控制面板/气泡/命令窗) |
| `lib/script/obj-*/` | 场景对象 (雪豹/雪堆/沙发/摩托/闹钟/音响/雪球) |
| `lib/script/practical/` | 粒子特效 (16 种) |
| `lib/script/SEanima/` | 动画系统 |
| `services/` | YuanBao-Free-API 中转服务 |
| `resc/` | 资源：GIF/音效/字体/模型 |
| `scripts/` | 打包与发布脚本 |

## 开发规范

1. 所有代码注释、提交信息、对话必须使用**简体中文**
2. 每个功能点完成后立即提交，格式：`<类型>: <简要描述>`
3. 每次提交后立即推送 (`git push`)
4. 不提交敏感文件 (.env, *.db, 密钥/Token)

## 启动方式

```powershell
# 首次运行
python install_deps.py

# 启动程序
python lib/core/qt_desktop_pet.py
```

或直接双击 `启动程序.bat`

## 打包发布

```powershell
python scripts/package_release.py --version 2.0
python scripts/package_green_release.py --version 2.0
```