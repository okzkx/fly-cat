# 变更报告：sync-doc-download-status

## 基本信息

- **变更名称**：sync-doc-download-status
- **归档路径**：`openspec/changes/archive/2026-03-29-sync-doc-download-status/`
- **Schema**：spec-driven

## 变更动机

知识库目录中，当用户选择目录或整个知识空间创建同步任务后，其下包含的文档状态标签不会从"未同步"更新为"同步中"。根因是 `getSyncingDocumentIds()` 仅从 `task.selectedSources` 中收集有 `documentId` 的来源，而目录/空间级别的选择不携带 `documentId` 字段，导致 `syncingIds` 始终为空集。

## 变更范围

- `SyncTask` 接口新增 `discoveredDocumentIds?: string[]` 字段
- 浏览器端 `createSyncTask` 在任务创建时存储已发现的文档 ID 列表
- `HomePage` 的 `getSyncingDocumentIds()` 优先从 `discoveredDocumentIds` 读取，兼容旧任务无此字段的场景

## 规格影响

- **sync-focused-application-experience**：修改 1 项需求（Sync Lifecycle Status Visibility），新增 1 项需求（SyncTask stores discovered document IDs）

## 任务完成情况

- [x] 1.1 在 `SyncTask` 接口添加 `discoveredDocumentIds` 字段
- [x] 2.1 在 `createSyncTask` 中填充 `discoveredDocumentIds`
- [x] 3.1 重构 `getSyncingDocumentIds()` 使用 `discoveredDocumentIds`
