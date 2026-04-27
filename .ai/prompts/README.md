# .ai/prompts

用于保存可复用 Prompt 模板。Prompt 只引用母本规范和技能，不重复粘贴完整规则。

## 命名规范

使用 `<name>.prompt.md`，frontmatter 必须包含 `description`、`agent` 和 `tools`。

## 创建条件

当一个任务入口会反复使用，且需要组合多份 instruction 或 skill 时创建。

