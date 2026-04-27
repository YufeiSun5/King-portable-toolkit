---
description: "Use when: AI 协作、文档更新、规范维护、MEMORY 更新、跨编辑器规则同步"
applyTo: "**/*"
---

# AI Workflow

- 开始任务前先读 `AGENTS.md`、`MEMORY.md` 和与改动范围相关的 `.ai/instructions/*.md`。
- 需求、架构、目录、技术栈、数据表或关键流程变化时，必须同步更新对应 instruction 或 `.ai/docs/`。
- 每次完成代码或文档改动后，更新 `MEMORY.md` 的当前状态或追加一条改动记录。
- `MEMORY.md` 改动记录必须为单行：`YYYY-MM-DD HH:MM | <model-name> | <一句话说明本次变更>`。
- 能写注释的源码文件必须在文件第一段写清楚：`文件说明：...` 和 `联动：...`；修改职责或依赖关系时同步更新。
- 不确定内容使用 `<!-- 待确认 -->`，不要把推测写成事实。
- `.ai/` 是母本；`.github/` 和 `.cursor/` 只做薄适配，不复制完整规范。
- Prompt 或 Skill 失效后移动到 `.ai/docs/archive/`，不要留在活跃入口。
- `MEMORY.md` 超过 100 行时，将历史改动归档到 `.ai/docs/changelog.md`。
