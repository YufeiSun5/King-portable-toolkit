---
description: "Use when: KIO CSV、字段元数据、变量编辑、批量操作、BIT 地址递增、导入导出、还原点"
applyTo: "backend/**,frontend/src/features/kio/**,.ai/docs/项目计划.md"
---

# KIO Domain Rules

- 所有原始 CSV 列必须保存到 `kio_variable_fields`，导出时按 `column_index` 还原顺序。
- 常用字段同步写入 `kio_variables`，但不能以常用字段表替代完整字段表。
- 默认常用字段为：`TagID`、`TagName`、`Description`、`ChannelName`、`DeviceName`、`TagGroup`、`ItemName`、`ItemDataType`、`ItemAccessMode`、`Enable`、`CollectInterval`、`HisRecordMode`、`HisInterval`。
- 列头批量操作必须支持预览和范围选择；应用后写入修改记录。
- BIT 地址递增规则：位地址 `0-7` 循环，每 8 个点字节地址加 1，例如 `DB103.1.7` 后为 `DB103.2.0`。
- 导出前必须支持校验，错误、警告、提示分级返回。
- 还原点以顶级项目为范围，保存项目树、CSV、变量、完整字段、表格视图和修改摘要。

