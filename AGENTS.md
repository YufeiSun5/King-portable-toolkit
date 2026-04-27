# Project Guidelines

## 项目摘要

便携工具包是一个基于 Wails、Go、React 和 SQLite 的本地 Windows 桌面工具箱。当前唯一内置工具是 KIO变量生成器，用于按项目和无限层级文件夹管理北京亚控 KIO 变量 CSV，并支持导入、编辑、校验、导出和项目还原点。

## 技术栈

- 桌面壳：Wails v2，React 通过 Wails Binding 调用 Go，不启动业务 HTTP 服务
- 后端：Go 1.25，SQLite 本地数据中心
- 前端：React、TypeScript、Vite、Zustand、lucide-react
- 环境：vfox 管理 `golang 1.25.5` 与 `nodejs 25.6.0`
- 主题：GitHub Dark 风格

## 核心模块

| 模块 | 路径 | 职责 |
| --- | --- | --- |
| Wails 入口 | `main.go`, `app.go` | 启动桌面应用、绑定 Go API、初始化 SQLite |
| 后端 API | `backend/api/` | 暴露工作区、KIO、批量操作、还原点等 Wails 方法 |
| 数据库 | `backend/database/` | 自动创建工作区目录、SQLite 迁移和字段元数据种子 |
| 领域模型 | `backend/domain/` | 项目树、KIO 变量、批量操作、校验、导出和还原点结构 |
| 前端工作台 | `frontend/src/` | GitHub Dark UI、KIO 表格、详情面板和交互状态 |
| 项目规划 | `.ai/docs/项目计划.md` | 产品需求、数据库表、页面和 API 蓝图 |

## 核心约定

- CSV 导入后以 SQLite 为准，导出时按完整字段和原始列顺序重新生成。
- 项目是顶级单位，项目下文件夹支持无限层级，CSV 可位于任意层级。
- KIO 所有字段都必须保留并可编辑；常用字段默认显示，高级字段默认隐藏。
- 批量操作必须先预览，支持全部行、筛选行、选中行、空值行、重复值行等范围。
- 还原点作用于顶级项目，退出时如存在未快照修改应提示创建还原点。
- 能写注释的源码文件必须在文件最顶部写明“文件说明”和“联动”，说明本文件职责以及与哪些模块、页面、数据表或生成绑定协作。

## 必读文件

- `MEMORY.md`：当前阶段、已完成事项、后续建议和改动记录。
- `.ai/instructions/ai-workflow.md`：AI 文档维护和更新规则。
- `.ai/instructions/backend.md`：Go、Wails、SQLite 后端规则。
- `.ai/instructions/frontend.md`：React 前端、交互和视觉规则。
- `.ai/instructions/kio-domain.md`：KIO CSV 字段、批量操作和还原点领域规则。

## 按需资源

| 资源 | 触发条件 |
| --- | --- |
| `.ai/skills/kio-csv-workflow/SKILL.md` | 处理 KIO CSV 导入、编辑、校验、导出流程时 |
| `.ai/agents/read-only-review.agent.md` | 需要只读审查架构、风险或规范偏差时 |
| `.ai/prompts/implement-feature.prompt.md` | 按现有规划实现新功能时 |
| `.ai/prompts/review-change.prompt.md` | 提交前做一次轻量代码审查时 |

## 强制工作流

开始任何开发前先读本文件、`MEMORY.md` 和相关 `.ai/instructions/`。完成代码或文档改动后，必须更新 `MEMORY.md` 的状态或改动记录。

新增或修改源码文件时，先检查文件顶部说明是否仍准确；如果职责或联动关系变化，必须同步更新顶部注释。

## 语言要求

面向用户的说明、文档和 UI 文案默认使用简体中文；代码标识符保持英文。
