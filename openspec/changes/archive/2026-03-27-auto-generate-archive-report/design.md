## Context

当前仓库里的 OpenSpec archive 主要依赖 `openspec archive` CLI 和仓库内的 archive skill/command 文档，但归档产物只保留原始 artifact，没有面向回顾使用的一页式总结。用户这次希望在 archive 完成时自动生成中文 Markdown 报告，并且希望能对已经归档的 change 补跑一次生成逻辑。由于 OpenSpec 官方 CLI 本身不在仓库内，因此无法直接修改其内部行为，最合适的方式是在仓库中增加归档包装脚本和独立报告生成器，再让仓库内工作流文档默认走该入口。

## Goals / Non-Goals

**Goals:**
- 在 change 成功 archive 后，自动在归档目录中生成一份固定文件名的中文 Markdown 报告
- 让报告从 proposal、design、specs、tasks 等现有归档工件中提取核心信息
- 提供一个可单独执行的补生成入口，支持对历史 archive 目录生成报告
- 更新仓库内 OpenSpec archive 相关命令/skills，使默认流程包含报告生成

**Non-Goals:**
- 不修改 OpenSpec CLI 的源码
- 不依赖 LLM 在线生成报告内容
- 不重写 proposal/design/specs 原始文件，只额外生成总结报告

## Decisions

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

## Risks / Trade-offs

- [不同 change 的 proposal/design 文风不一致] -> 通过保留原文摘要并使用稳定的中文章节标题，避免过度依赖严格格式
- [包装脚本需要推断归档目录] -> 优先根据 change 名称定位最新匹配目录，并在无法唯一定位时报错
- [README/skills 文档与实际脚本偏离] -> 将脚本路径写入文档并在测试/回填时真实使用该脚本

## Migration Plan

1. 新增报告生成脚本与 archive 包装脚本
2. 新增测试覆盖报告生成核心逻辑
3. 更新 archive command/skills 文档以及必要的 README 说明
4. 使用补生成入口为 `2026-03-27-optimize-tauri-port-handling` 产出报告
5. 运行测试、类型检查和 OpenSpec validate

## Open Questions

- 暂无。当前方案既支持未来自动生成，也支持历史归档回填，满足本次需求。
