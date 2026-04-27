---
description: "Use when: React、TypeScript、Vite、Wails 前端、GitHub Dark UI、KIO 表格、右键菜单"
applyTo: "frontend/src/**/*.{ts,tsx,css}"
---

# Frontend Rules

- TS/TSX/CSS/HTML 文件顶部必须写明文件职责和联动模块；职责变化时先更新顶部注释。
- 前端为桌面工具首屏，不做营销落地页；默认打开可操作的 KIO 工作台。
- UI 使用 GitHub Dark 语义色，保持紧凑、可扫描、面向重复编辑任务。
- 常用字段默认显示，高级字段通过列设置、全部字段、右侧详情面板进入。
- 表格、工具栏、按钮和面板必须设置稳定尺寸，避免编辑、筛选、切换列时布局跳动。
- 图标优先使用 `lucide-react`，图标按钮必须有 `title` 或 `aria-label`。
- 前端状态可先用 Zustand 管理；接入 Wails Binding 后，写操作以 Go 返回结果为准。
- 不在 UI 中写“如何使用本功能”的说明性大段文本，交互入口应直接可用。
