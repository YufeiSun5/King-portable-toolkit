---
description: "Use when: 测试、验证、go test、npm build、Wails 构建、回归用例"
applyTo: "**/*.{go,ts,tsx},frontend/package.json,go.mod"
---

# Testing Rules

- 后端行为变化优先补 Go 单元测试，特别是 CSV 解析、字段保留、批量操作和快照恢复。
- 前端行为变化至少运行 `npm run build`；复杂交互后补充组件或端到端测试方案。
- 每次验证记录实际运行的命令和结果；无法运行时说明环境原因。
- 不通过删除、跳过或弱化测试来掩盖失败。
- 当前初始化阶段允许先无测试目录；实现首个核心算法时同步建立测试。

