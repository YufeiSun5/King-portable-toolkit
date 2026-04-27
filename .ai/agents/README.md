# .ai/agents

用于保存自定义 Agent 定义。Agent 文件描述角色、职责、最小工具集和检查清单，不依赖某个编辑器的专有能力。

## 命名规范

使用 `<name>.agent.md`，frontmatter 必须包含 `description`、`name` 和 `tools`。

## 创建条件

当一个审查或协作角色有稳定职责和明确边界时创建。默认只创建只读审查 Agent；深度审阅流程仅在用户明确发起时创建。

