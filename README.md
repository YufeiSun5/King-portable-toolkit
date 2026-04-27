# 便携工具包

基于 Wails、Go、React 和 SQLite 的本地桌面工具箱。当前第一个工具是 KIO变量生成器，用于管理、导入、编辑、校验和导出北京亚控 KIO 变量 CSV。

## 技术栈

- Wails v2 桌面壳，不启动 HTTP 服务、不占用端口
- Go 后端，SQLite 本地数据中心
- React + TypeScript + Vite 前端
- GitHub Dark 视觉主题
- vfox 管理 Go / Node 环境

## 本地启动

```powershell
vfox use golang@v1.25.5 --project
vfox use nodejs@v25.6.0 --project
go install github.com/wailsapp/wails/v2/cmd/wails@v2.12.0
cd frontend
npm install
cd ..
.\scripts\dev.ps1
```

如果当前终端未刷新 vfox 环境，重新打开 wt7 或执行：

```powershell
Invoke-Expression (vfox env -s pwsh --full)
```

注意：不要直接在缺少 `C:\Windows\System32` 的 vfox PATH 里运行 `wails dev`。Wails 在 Windows 下需要 `taskkill` 清理开发进程，PATH 缺失会导致 dev 退出或 WebView 黑屏；`scripts/dev.ps1` 已补齐系统 PATH。

## 目录

- `backend/`：Go 后端分层代码、SQLite 初始化、KIO 领域模型
- `frontend/`：React 前端工作台
- `.ai/`：AI 协作规范、技能、Agent、Prompt 和项目规划
- `docs/`：面向开发者的设计文档
