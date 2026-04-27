---
description: "Use when: Go 后端、Wails Binding、SQLite、数据库迁移、仓储服务、文件系统、还原点"
applyTo: "**/*.go,backend/**,main.go,app.go"
---

# Backend Rules

- Go 文件顶部必须先写两行注释：文件职责和联动模块，再声明 `package`。
- Wails Binding 方法必须是可序列化的明确入参和返回值；避免把内部数据库连接、文件句柄暴露给前端。
- 后端负责数据真实性：CSV 导入后以 SQLite 为准，前端只做展示和交互。
- SQLite 初始化必须自动创建工作区目录、数据库文件、迁移和必要种子数据。
- 表结构变更写入 `backend/database/migrations.go`，字段元数据变更写入 `backend/constants/kio_field_metadata.go`。
- 对项目、文件夹、CSV、变量、还原点的写操作必须记录修改时间；批量操作还应写入 `change_logs`。
- 涉及多表写入时使用事务，避免只写入常用字段而遗漏 `kio_variable_fields` 完整字段。
- Windows 路径处理使用 `filepath`，不要手写路径分隔符。
