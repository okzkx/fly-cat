## Why

`opencat-task` 要求 OpenCat 中文归档报告路径为 `.claude/docs/opencat/<timestamp(分钟)>-<change-name>.md`，即 **12 位** `YYYYMMDDHHmm` 与英文 kebab-case 变更名。历史文件存在秒级后缀、ISO 日期前缀等不一致命名，不利于检索与自动化对齐。

## What Changes

- 将 `.claude/docs/opencat/` 下现有归档 Markdown **批量重命名**为 `YYYYMMDDHHmm-<kebab-name>.md` 格式（保留语义化变更名后缀，时间戳收敛到分钟精度）。
- 更新 `DONE.md` 等文档中对旧文件名的 **引用路径**。

## Capabilities

### New Capabilities

- `opencat-archive-reports`：约定 `.claude/docs/opencat/` 下 OpenCat 中文归档 Markdown 的文件命名格式（分钟级时间戳 + kebab-case 变更名），便于与 `opencat-task` 技能一致。

### Modified Capabilities

（无 — 不修改既有产品能力规格正文。）

## Impact

- 仅影响 `.claude/docs/opencat/` 下文件名与少量站内引用（如 `DONE.md`）。
- 应用行为、OpenSpec 主规格正文无变更。
