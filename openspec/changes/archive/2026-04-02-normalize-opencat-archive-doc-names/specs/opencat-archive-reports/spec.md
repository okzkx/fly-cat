## ADDED Requirements

### Requirement: OpenCat 归档报告 Markdown 文件名格式

`.claude/docs/opencat/` 目录下的 OpenCat 中文归档报告 Markdown 文件 SHALL 使用文件名格式 `YYYYMMDDHHmm-<change-name>.md`：前 12 位为日期与时间（精确到分钟），随后一个连字符（`-`），`<change-name>` SHALL 为英文 kebab-case，并与对应 OpenSpec 变更的稳定标识一致。

#### Scenario: 新归档文件符合命名

- **WHEN** 在 `.claude/docs/opencat/` 新增或整理 OpenCat 归档报告 Markdown
- **THEN** 文件名由 12 位数字、一个连字符、kebab-case 片段和扩展名 `.md` 组成，且不包含秒级后缀或 ISO `YYYY-MM-DD` 形式的前缀段

#### Scenario: 与技能约定对齐

- **WHEN** 维护者对照 `opencat-task` 技能中的归档路径说明
- **THEN** 上述命名与技能中 `<timestamp(分钟)>-<change-name>.md` 的约定一致
