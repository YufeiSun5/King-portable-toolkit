你是一个 AI 工程化专家。请为当前项目搭建完整的 AI 协作文档体系。

## 目标

在项目中建立一套让 AI Agent（跨编辑器：Copilot、Cursor、Trae 等）高效协作的文档结构，包括：项目路引、编码规范、可复用技能、自定义 Agent、Prompt 模板和开发进度追踪。

## 要求

### 第一步：分析项目

#### 1.1 扫描边界

先明确分析范围：
- **忽略目录**：`node_modules`、`dist`、`build`、`.next`、`coverage`、`vendor`、`generated`、`__pycache__`、`.cache`、锁文件等构建产物/依赖/缓存/生成文件
- **优先阅读**：根 README、包管理配置（package.json / go.mod / Cargo.toml / pom.xml 等）、入口文件、核心业务目录、测试目录、CI 配置
- **大项目策略**：若项目超过 20 个核心模块或代码量巨大，先抽样核心模块分析，不要求全量扫描。其余模块放入 backlog 后续覆盖
- **核心模块判定**：优先依据入口引用链、主业务目录、构建配置、CI 触达范围、测试覆盖密度和 README 明示模块综合判断
- **"代码量巨大"判定**：指项目存在明显多子系统、目录层级复杂、配置与入口分散，或一次分析难以形成可靠全局认知的情况

#### 1.2 分析内容

在扫描边界内，弄清楚：
- 项目定位和核心职责
- 技术栈（语言、框架、构建工具）
- 模块划分和各自职责
- 已有的编码约定和架构决策
- 项目当前处于什么阶段（初建/开发中/维护）
- 有哪些反复出现的开发操作模式

#### 1.3 信息源优先级

当不同来源信息冲突时，按以下优先级判断：

**运行配置 / 构建脚本 / CI 配置 / 当前源码结构 > 测试用例 > README > 其他历史文档 > 注释 > issue / commit**

#### 1.4 降级策略

分析过程中遇到不确定情况时：
- 若项目规范不一致，优先记录"现状"而非强行统一
- 若无法确认架构决策，标注为 `<!-- 待确认 -->`
- 若项目过大无法全量分析，仅覆盖核心模块，其余列入 backlog
- 若已有规范冲突，说明冲突来源和各方现状，不自行拍板

### 第二步：输出分析报告

**不要直接创建文件。** 先输出以下内容供确认：
1. 项目认知总结（定位、技术栈、模块、阶段、核心约定）
2. 建议的 `.ai/` 目录结构和文件清单
3. 每个文件的预期内容摘要（一句话）
4. 识别到的不确定点和待确认事项
5. 若为大项目，说明本轮覆盖范围和后续 backlog

每个关键判断至少附1个依据来源说明（如：来自哪个目录、配置文件、测试或入口文件），不要求详细引用，但必须可回溯。

等用户确认后进入第三步。若用户明确表示“直接创建”，或项目同时满足以下多数条件，可跳过确认直接执行：
- 核心模块 ≤10
- 技术栈不超过 2~3 类
- 根目录结构清晰，无明显多子系统 / monorepo 特征
- 现有文档与代码大体一致

### 第三步：按优先级创建文件

#### 3.1 输出优先级

按以下顺序创建，确保核心文件质量优先：

**第一优先级（必须）：**
1. `AGENTS.md` — 项目概述与导航入口（自动加载，兼任路引）
2. `.ai/instructions/ai-workflow.md` — 文档更新规范
3. 核心 instructions（2~4 个高价值规范文件）
4. `MEMORY.md` — 开发进度追踪

**第二优先级（按需）：**
5. `.ai/docs/` — 功能设计文档
6. `.ai/skills/` — 高频技能（2~3 个）
7. `.ai/agents/` — 至少一个只读审查 Agent
8. `.ai/prompts/` — 常用 Prompt 模板

**第三优先级（编辑器适配）：**
9. `.github/copilot-instructions.md` — Copilot 仓库级入口
10. `.github/instructions/*.instructions.md` — Copilot 路径级规则
11. `.cursor/rules/*.mdc` — Cursor 规则入口

#### 3.2 安全写入规则

- 若目标文件已存在，优先**合并和补充**，不盲目覆盖。合并时优先保留原文件结构并补全缺失章节；若原内容与当前分析冲突，保留原文并标注 `<!-- 待确认 -->`
- 不确定的内容写成 `<!-- 待确认 -->`，不伪装成确定结论
- 具体的 skill / agent / prompt / doc 文件按需创建，但**目录结构必须完整创建**
- 每个按需目录（docs / skills / agents / prompts）中必须放一个 `README.md`，说明该目录用途、文件命名规范和创建条件，防止用户看到目录后不知道怎么用
- 除目录 README 外，不为凑结构创建占位型业务文件；按需文件仅在有项目证据支撑时创建
- 若项目已有同类文档，新增文档应**链接到现有文档**而非重复描述

#### 3.3 文件结构

所有目录必须创建。具体文件中标注 `[按需]` 的根据项目实际情况决定是否创建。

```
AGENTS.md                     — 项目概述与导航入口（根目录，≤300行，自动加载）
MEMORY.md                     — 开发进度追踪（根目录）
.ai/
  instructions/               — 分领域编码规范
    ai-workflow.md            — 文档更新规范（必须）
    *.md                      — 其他规范文件（按需）
  docs/                       — 功能设计与跟踪文档
    README.md                 — 目录说明：用途、文件命名规范、创建条件
    changelog.md              — MEMORY.md 历史归档索引（按需）
    archive/                  — 失效 prompt / skill / doc 的归档目录（按需）
    *.md                      — 设计文档（按需）
  skills/                     — 可复用操作模板
    README.md                 — 目录说明：什么是技能、提炼标准、目录结构要求
    <skill-name>/SKILL.md     — 具体技能（按需）
  agents/                     — 自定义 Agent
    README.md                 — 目录说明：Agent 定义规范、工具限制说明
    <name>.agent.md           — 具体 Agent（按需）
  prompts/                    — Prompt 快捷模板
    README.md                 — 目录说明：Prompt 格式要求、引用方式
    <name>.prompt.md          — 具体 Prompt（按需）
```

> 深度审阅流程相关产物（`tests/`、`deep-review.agent.md`、`deep-review.prompt.md`、`MEMORY.md` 的 `## 审阅日志` 段落）属于**用户主动发起**的可选能力，**默认不创建、不主动询问**，仅当用户明确要求（如"启用审阅流程"、"加上深阅"、"/review"等触发语）时按本提示词"深度审阅流程产物"小节增量创建。

### 第四步：各文件的格式要求

#### AGENTS.md（根目录 — 唯一自动加载入口）

AGENTS.md 是编辑器（Copilot / Cursor 等）每次对话自动加载的文件，因此同时承担"项目概述"和"导航路引"两个角色。不再创建独立的 `.ai-instructions` 路引文件。

- 标题用 `# Project Guidelines`

**上半部分——项目摘要：**
- 项目定位（1-2句）
- 技术栈（列表）
- 核心模块一览（表格，只列核心模块，非核心省略）
- 核心约定（4-5条）

**下半部分——文档导航：**
- **必读文件**：按重要度列出 MEMORY.md → 核心 instructions（仅列最重要的 2~3 个，附一句话说明）
- **按需资源**：一个精简表格，列出 `.ai/` 下 docs / skills / agents / prompts 的关键文件和触发条件（已由 YAML frontmatter 的 description 辅助发现，此处仅列最常用项）
- **强制工作流**：开始前读什么 → 完成后更新 MEMORY.md
- **语言要求**

详细内容拆到 `.ai/docs/` 中，AGENTS.md 只做索引和导航。控制在 300 行以内，因为每次对话都会全量加载。

#### .ai/instructions/*.md（编码规范）
- 每个文件必须有 YAML frontmatter：
  ```yaml
  ---
  description: "Use when: 触发关键词描述"
  applyTo: "glob 模式"    # 可选，按文件类型自动附加
  ---
  ```
- 一个文件只管一个关注点（后端/前端/接口/测试，不要混写）
- 内容简洁可执行，用列表不用长段落
- 如果项目是多语言的，按语言或领域拆分
- 必须创建一个 `ai-workflow.md` 定义文档更新规范

#### .ai/skills/<name>/SKILL.md（技能模板）
- 必须有 YAML frontmatter：
  ```yaml
  ---
  name: skill-name           # 必须和目录名一致
  description: "Use when: 关键词丰富的触发描述"
  argument-hint: "输入提示"
  ---
  ```
- 正文包含：适用场景、项目约定（含代码示例）、操作步骤、关键约束
- **技能提炼门槛**：仅当操作满足以下全部条件时才提炼为技能：
  - 在项目中出现 3 次以上的重复模式
  - 有明确的输入和输出
  - 步骤稳定可复现
  - 含有项目特有的约束或规范
  - 能复用到未来的同类任务
- 通用且无项目特征的操作（如"读代码"、"修 bug"）不要创建技能

#### .ai/agents/<name>.agent.md（自定义 Agent）
- 必须有 YAML frontmatter：
  ```yaml
  ---
  description: "Use when: 触发描述"
  name: "agent-name"
  tools: [read, search]      # 最小工具集
  ---
  ```
- 正文定义：角色定位、职责范围、约束（不做什么）、具体检查清单或工作步骤
- 最少创建一个只读审查 Agent（tools: [read, search]）
- `tools` 为文档级能力约束声明，用于表达最小必要能力，不依赖具体编辑器实现

#### .ai/prompts/<name>.prompt.md（Prompt 模板）
- 必须有 YAML frontmatter：
  ```yaml
  ---
  description: "一句话描述用途"
  agent: "agent"
  tools: [read, edit, search]
  ---
  ```
- 正文用 Markdown 链接引用相关的 instructions 和 SKILL.md
- 为项目中最常见的 3~5 个操作创建 Prompt；若项目场景较少，可少于 3 个，但不得为凑数创建低价值模板

#### MEMORY.md（开发进度）
- 包含：当前阶段、已完成事项、AI工程化状态清单、后续建议、**改动记录**
- 文件头标注最后更新日期
- 控制在 100 行以内，超出归档到 `.ai/docs/changelog.md`
- **改动记录格式**：每条单行，简短清晰，必含模型名与精确到分钟的时间戳
  ```
  - YYYY-MM-DD HH:MM | <model-name> | <一句话说明本次变更>
  ```
  - 时间使用本地时区，精确到分钟（不要只到日）
  - `model-name` 为执行本次改动的模型标识，如 `claude-opus-4.7`、`gpt-5`、`gemini-2.5-pro`
  - 描述不超过 80 字，禁止多段长文；多文件改动归并为一条
- 启用深度审阅流程时，另起 `## 审阅日志` 段落，每轮单行记录（见下方深度审阅章节）

#### 深度审阅流程产物（用户主动发起时创建，默认不创建）

##### tests/ 目录
- 优先复用项目已有测试目录与框架；无则按语言惯例新建
- `tests/README.md` 必须说明：使用的测试框架、统一运行命令、目录组织、覆盖范围期望
- `ai-review/`（或等价子目录）存放审阅流程触发新增的回归用例，文件命名应能回溯到触发它的审阅事项

##### .ai/agents/deep-review.agent.md
- frontmatter `tools` 最小集为 `[read, search, edit, run]`（含 `run` 以执行测试）
- 工作循环固定 5 步，必须按序执行：
  1. **审阅**：基于 `.ai/instructions/` 与最近 diff，输出问题清单
  2. **补测试**：为未覆盖的关键路径补写测试到 `tests/`
  3. **跑测试**：运行项目测试命令，收集失败列表
  4. **修失败**：针对失败最小化修复；**禁止通过删除/跳过测试绕过失败**
  5. **再审阅**：回到步骤 1，直到无新问题且测试全绿
- 退出条件：连续两轮无新增问题且测试全部通过
- 每轮结束必须向 `MEMORY.md` 的 `## 审阅日志` 追加一条记录

##### .ai/prompts/deep-review.prompt.md
- 引用 `deep-review.agent.md` 与相关 instructions
- 提供启动入口（如：`/review` 或一句话触发）

##### MEMORY.md 审阅日志格式
```
## 审阅日志
- YYYY-MM-DD HH:MM | <model-name> | round <N> | <一句话说明本轮变更与结论>
```
- 时间精确到分钟；`round N` 标记当前是第几轮循环；结论需明示"通过 / 继续下一轮"

### 第五步：内容质量检查清单

创建完毕后自查：

#### 形式检查
- [ ] AGENTS.md ≤ 300 行，上半部分为项目摘要、下半部分为导航路引
- [ ] 所有 instructions/skills/agents/prompts 都有正确的 YAML frontmatter
- [ ] skills 的 `name` 字段和目录名一致
- [ ] description 都用 "Use when: ..." 格式，关键词丰富
- [ ] AGENTS.md 导航区列出的每个文件都实际存在
- [ ] MEMORY.md 中没有引用不存在的文件
- [ ] instructions 之间没有内容重复（尤其和 AGENTS.md）
- [ ] 每个 Agent 的 tools 是最小必要集，不是全部工具
- [ ] 强制工作流中要求完成后更新 MEMORY.md
- [ ] MEMORY.md 改动记录格式符合规范（含模型名 + 精确到分钟时间戳，单行简短）
- [ ] 默认不创建深度审阅产物；仅当用户主动发起时，`tests/`、`deep-review.agent.md`、`deep-review.prompt.md`、`MEMORY.md` 的 `## 审阅日志` 均已创建

#### 内容可信度检查
- [ ] 每个 instruction 都能在项目中找到至少一个证据来源（代码、配置或测试）
- [ ] 每个 skill 都对应至少一个真实的高频开发流程
- [ ] 每个 prompt 都引用实际存在的 instruction 或 skill
- [ ] 模块划分与项目实际目录结构和入口文件一致
- [ ] 未确认内容都显式标记为 `<!-- 待确认 -->`，不伪装成确定事实
- [ ] 没有把构建产物、生成代码、历史遗留当作当前规范依据

#### 适配层检查
- [ ] 适配文件不包含完整规范正文，只做导航和入口
- [ ] 每个适配文件引用的 `.ai/` 母本文件实际存在
- [ ] `.github/instructions/*.instructions.md` 的 `applyTo` 与对应 `.ai/instructions/*.md` 的 `applyTo` 覆盖范围一致
- [ ] `.cursor/rules/*.mdc` 的 `globs` 与对应 `.ai/instructions/*.md` 的 `applyTo` 覆盖范围一致
- [ ] 适配层文件总行数不超过对应母本文件

### 完成验收

创建完成后，输出以下内容作为本轮结束：
1. 已创建文件清单（含路径）
2. 自查结果摘要（通过 / 未通过项）
3. 待确认项汇总
4. 后续建议（如有 backlog 或待补充项）

### 维护与演进

为确保 `.ai/` 体系不会过时，遵循以下规则：
- 在 `ai-workflow.md` 中定义：哪些项目变更必须同步更新 instructions（如技术栈切换、目录重构、模块新增）
- 失效的 prompt 和 skill 及时归档到 `.ai/docs/archive/`，不要留在活跃目录
- MEMORY.md 超过 100 行时归档到 `.ai/docs/changelog.md`
- 每次重大重构后应重新审视 `.ai/` 体系的准确性

### 大项目适配

若项目为 monorepo 或包含多个子系统：
- 根级 `.ai/` 存放通用规范和导航
- 各子项目/子模块可拥有自己的局部 `.ai/instructions/`
- 根目录只保留跨子系统的共性规范和导航索引
- 子系统特有规范不要塞进根级 instructions
- 当根级规范与子系统局部规范冲突时，子系统局部规范在其作用域内优先，根级规范仅提供共性约束

### 编辑器适配层

`.ai/` 体系为母本，存放全量规范内容。为提升 Copilot 和 Cursor 的原生规则发现能力，补充一层很薄的适配入口。

#### 总原则

- `.ai/` 写全量内容，适配层只写短入口，不写第二套正文
- 适配文件的职责是“告诉编辑器去读哪份母本”，不是复制规范
- 适配层文件永远比母本短，单文件控制在 10~20 行
- 只维护母本，适配层仅在母本文件重命名或路径变更时同步引用

#### Copilot 适配（必做）

Copilot 原生识别 `.github/copilot-instructions.md`（仓库级常驻）和 `.github/instructions/*.instructions.md`（路径级）。

**`.github/copilot-instructions.md`**：
- 控制在 10~20 行
- 内容仅包括：先读 AGENTS.md（项目概述和导航路引已在其中）、信息源优先级、待确认标记规则、完成后更新 MEMORY.md、语言要求
- 不包含具体编码规范

**`.github/instructions/*.instructions.md`**：
- 仅为核心 `.ai/instructions/*.md` 创建对应的适配文件（2~4 个），不全量镜像
- 文件名必须以 `.instructions.md` 结尾
- 必须有 YAML frontmatter 含 `applyTo` 字段，与对应母本的 `applyTo` 覆盖范围一致
- 正文只写：先读哪几份母本文件 + 2~4 条关键约束

示例：
```md
---
applyTo: "**/*.ts,**/*.tsx,src/frontend/**"
---

Read `AGENTS.md` and `.ai/instructions/frontend.md` before editing these files.

Rules:
- Follow existing component patterns before introducing new abstractions.
- Keep changes minimal and consistent with nearby files.
- Update related tests when behavior changes.
- Mark uncertain decisions as `<!-- 待确认 -->`.
```

#### Cursor 适配（建议）

Cursor 识别 `.cursor/rules/*.mdc` 目录下的规则文件。

**`.cursor/rules/00-core.mdc`**：
- 设置 `alwaysApply: true`，`globs: ["**/*"]`
- 内容与 `copilot-instructions.md` 对等：先读 AGENTS.md（导航路引已在其中）、同样的核心约束

**`.cursor/rules/<domain>.mdc`**：
- 仅为核心领域创建（2~4 个），不全量镜像
- 设置 `alwaysApply: false`，用 `globs` 指定作用范围，与对应母本的 `applyTo` 一致
- 正文只写：先读哪几份母本文件 + 2~4 条关键约束

示例：
```md
---
description: Frontend file editing rules
globs: ["**/*.tsx", "**/*.jsx", "src/frontend/**"]
alwaysApply: false
---

Before editing these files, read:
- `AGENTS.md`
- `.ai/instructions/frontend.md`

Rules:
- Reuse existing UI patterns before creating new abstractions.
- Keep props and state handling consistent with nearby files.
- Update related tests when UI behavior changes.
```

#### 适配层映射关系

| 母本 | Copilot 适配 | Cursor 适配 |
|------|-------------|-------------|
| `AGENTS.md`（概述+导航） | 直接复用 + `.github/copilot-instructions.md` 引用 | 直接复用 + `00-core.mdc` 引用 |
| `.ai/instructions/<domain>.md` | `.github/instructions/<domain>.instructions.md` | `.cursor/rules/<domain>.mdc` |
| `MEMORY.md` | 仓库级入口中要求更新 | 核心规则中要求更新 |

#### 同步纪律

1. **只改母本**：规范变化先改 `.ai/`，不直接改适配层
2. **引用同步**：仅当母本文件重命名或路径变更时，同步适配层的引用
3. **不承载细节**：适配层只做导航、触发和少量硬规则

### 通用原则

- **证据优先**：文档内容必须基于源码、构建配置、测试和 CI 推断，不得凭空编造
- **精简优先**：AGENTS.md 和 instructions 会占用上下文窗口，越短越好
- **关键词驱动发现**：description 是 Agent 发现文件的唯一依据，关键词要准
- **一个文件一个关注点**：不要把测试规范和 API 规范混在一起
- **Show don't tell**：用简短代码示例而非长段落解释
- **Link don't embed**：详细内容放 docs，主文件只索引
- **跨编辑器兼容**：不依赖特定编辑器的机制（如 Hooks），文件格式通用
- **安全写入**：已有文件优先补充不覆盖，不确定标记待确认，不创建空洞文件