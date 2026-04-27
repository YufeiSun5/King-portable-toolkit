---
name: kio-csv-workflow
description: "Use when: KIO CSV 导入、字段保留、变量编辑、批量修改、校验、导出、BIT 地址递增、还原点"
argument-hint: "输入 CSV 文件、目标项目/文件夹、需要执行的 KIO 操作"
---

# KIO CSV Workflow

## 适用场景

- 导入北京亚控 KIO 变量 CSV。
- 编辑常用字段或高级字段。
- 执行列自动填充、批量替换、编号递增、BIT 地址递增。
- 导出 CSV 前校验并创建修改记录或还原点。

## 项目约定

- CSV 导入后以 SQLite 为准。
- 所有原始列进入 `kio_variable_fields`，常用字段同步进入 `kio_variables`。
- 导出时按 `column_index` 恢复列顺序。
- 批量操作必须先预览，再应用。

## 操作步骤

1. 读取 `.ai/instructions/kio-domain.md` 和 `.ai/docs/项目计划.md` 的相关章节。
2. 确认目标范围：项目、文件夹、CSV、选中行或筛选行。
3. 对导入流程，先保存文件副本到工作区，再解析表头、变量和完整字段。
4. 对编辑流程，同时更新常用字段表和完整字段表。
5. 对批量操作，先返回 `OperationPreview`，用户确认后写入数据和 `change_logs`。
6. 对导出流程，先运行校验，再按编码和换行选项生成 CSV。

## 关键约束

- 不允许因为 UI 默认隐藏而丢弃高级字段。
- BIT 地址递增必须按 `0-7` 位循环。
- 批量操作范围默认不要越过用户当前选择或筛选。

