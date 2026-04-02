# project-done-log Specification

## Purpose
TBD - created by archiving change normalize-done-md. Update Purpose after archive.
## Requirements
### Requirement: DONE 日志文件位置与标题

项目 SHALL 在仓库根目录维护 `DONE.md`，其第一级标题 MUST 为 `# DONE`。

#### Scenario: 贡献者定位完成记录

- **WHEN** 贡献者在仓库根目录查找 OpenCat 完成记录
- **THEN** 其能找到名为 `DONE.md` 的文件且首行标题为 `# DONE`

### Requirement: 条目为单行且含时间与摘要

除文件标题外，每条完成记录 MUST 为单行 Markdown 无序列表项，格式为 `- [<时间>] <任务名称> — <变更摘要>`，其中 `<时间>` SHALL 使用 `YYYY-MM-DD` 或 `YYYY-MM-DD HH:mm`（与历史一致即可），任务名称与变更摘要之间 SHALL 使用全角 `—`。

#### Scenario: 读者扫读单条记录

- **WHEN** 读者阅读任意一条完成记录
- **THEN** 该记录占据单独一行且以 `- [` 起始，并包含成对的 `]` 与全角 `—` 分隔任务名与摘要

### Requirement: 内容保持精简

`DONE.md` SHALL 保持队列式精简记录，不应在单条内展开长段落说明；细节 SHALL 归入 OpenSpec 归档报告或代码提交说明。

#### Scenario: 单条长度可控

- **WHEN** 维护者追加新的完成任务
- **THEN** 新增行应为单行摘要，而非多段正文

### Requirement: 与 OpenCat Work 文档约定对齐

维护 `DONE.md` 时 MUST 遵循 `/opencat-work` 技能中对 `TODO.md` / `DONE.md` 的解析约定：完成记录用于追溯变更与验证线索，不替代规格或归档正文。

#### Scenario: 自动化或人工队列消费

- **WHEN** OpenCat Work 流程读取 `DONE.md` 作为权威来源之一
- **THEN** 条目格式不与该流程声明的推荐格式相冲突

