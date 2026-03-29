## 基本信息

- 变更名称：`document-freshness-check`
- Schema：`spec-driven`
- 创建日期：`2026-03-29`
- 归档路径：`openspec/changes/archive/2026-03-29-document-freshness-check`

## 变更动机

同步管道在 `spawn_sync_progress` 内部已经跳过未变更的文档，