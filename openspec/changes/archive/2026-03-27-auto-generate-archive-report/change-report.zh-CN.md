# 归档变更报告

## 基本信息

- 变更目录：`2026-03-27-auto-generate-archive-report`
- 工作流 Schema：`spec-driven`
- 归档报告文件：`change-report.zh-CN.md`
- 任务完成度：7/7
- 规格变更数量：1

## 变更背景

当前 OpenSpec change 在 archive 后只保留 proposal、design、specs 和 tasks 等原始工件，缺少一份面向人阅读的中文变更报告，导致后续回顾时需要逐个打开多个文件才能理解变更背景、范围和完成情况。需要在 archive 完成时自动生成这份中文总结，并支持对历史归档补生成。

## 变更内容

- 为已归档 change 增加自动生成中文变更报告的能力，统一输出到归档目录内。
- 为 archive 工作流增加一个包装入口，在执行 `openspec archive` 成功后自动生成中文报告。
- 提供对历史归档目录补生成中文报告的能力，并先为 `2026-03-27-optimize-tauri-port-handling` 生成这份报告。
- 更新 OpenSpec archive 相关命令/skill 文档，使仓库内的归档流程默认使用带报告生成的入口。

## 关键设计

### 1. 采用“两层脚本”结构：生成器 + archive 包装器

新增一个纯报告生成脚本，负责读取归档目录并输出 `change-report.zh-CN.md`；再新增一个 archive 包装脚本，负责先调用 `openspec archive`，成功后自动调用生成器。这样既能自动覆盖新归档，也能单独对历史归档做 backfill。

备选方案：
- 只写一个 archive 包装器：无法方便对历史归档单独补生成
- 只更新 AI skill，不提供脚本：流程不够稳定，也无法脱离 AI 复用

### 2. 报告内容从现有工件提取，不引入额外元数据文件

报告从 archive 目录下的 `proposal.md`、`design.md`、`tasks.md`、`specs/**/*.md`、`.openspec.yaml` 中提取信息，输出统一中文标题、摘要和任务统计。这样可以避免维护额外数据源，也能对历史归档直接工作。

备选方案：
- archive 时同时写 JSON 元数据：更结构化，但需要先解决历史归档没有该文件的问题
- 直接复制原始 Markdown：信息密度不够高，达不到“变更报告”的目的

### 3. 用固定英文文件名保存中文报告

报告文件命名为 `change-report.zh-CN.md`。内容使用中文，文件名保持 ASCII，便于脚本处理、跨平台兼容和 Git 差异查看。

备选方案：
- 使用中文文件名：可读性更强，但脚本和终端兼容性略差
- 使用通用 `report.md`：语义不够明确，也难区分语言版本

### 4. 仓库内 archive 文档改为默认使用包装脚本

更新 `.cursor` / `.claude` 中的 archive command 与相关 skill 文档，使“执行 archive”这一步默认调用仓库脚本而不是裸 `openspec archive`。这样仓库的 agent 工作流和手动脚本入口保持一致。

备选方案：
- 保持文档不变，仅提供脚本：未来 agent 仍可能跳过报告生成

## 规格影响

- `archive-change-reporting`：归档中包含 delta spec（`specs/archive-change-reporting/spec.md`）

## 任务完成情况

- 已完成：7
- 未完成：0

### 已完成任务

- 1.1 Add a reusable archive report generator that reads archived proposal, design, specs, and tasks artifacts and writes `change-report.zh-CN.md`
- 1.2 Add an archive wrapper entry that runs `openspec archive` and automatically generates the Chinese archive report on success
- 2.1 Update archive-related command/skill documentation to use the repository-supported archive entry with report generation
- 2.2 Update README guidance for archive reporting and backfill usage
- 3.1 Add or update tests for archive report generation behavior
- 3.2 Generate the Chinese archive report for `2026-03-27-optimize-tauri-port-handling` using the supported backfill entry
- 3.3 Run validation and project checks for the archive-reporting change

### 未完成任务

- 无
