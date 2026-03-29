# 变更报告：sync-doc-realtime-status

## 基本信息

- **变更名称：** sync-doc-realtime-status
- **Schema：** spec-driven
- **归档路径：** openspec/changes/archive/2026-03-29-sync-doc-realtime-status/

## 变更动机

选择父文件夹（或知识库）并点击"开始同步"时，所有子文档一直显示"未同步"状态，直到整个同步完成才统一变为"已同步"。期间没有任何视觉反馈，用户体验不佳。期望行为：子文档在发现完成后立即显示"等待同步"，然后逐个更新为"已同步"。

## 变更范围

### Rust 后端 (`src-tauri/src/commands.rs`)
- `SyncTask` 结构体新增 `discovered_document_ids` 字段（`#[serde(default)]` 保证向后兼容）
- `spawn_sync_progress` 在文档发现完成后将所有文档 ID 存入 `task.discovered_document_ids`
- manifest 持久化从每 10 个文档批量保存改为每个文档保存一次

### React 前端 (`src/components/HomePage.tsx`)
- `DocumentSyncStatusTag` 对已发现但未同步的文档显示"等待同步"标签，替代原来的"同步中 X/Y"

### 规格变更
- `knowledge-base-source-sync`：新增"Discovered document IDs included in task"和"Manifest saved after every document"两个场景
- `knowledge-tree-display`：新增 5 个场景覆盖"等待同步"状态显示

## 任务完成情况

全部 5/5 任务已完成：
- [x] 1.1 在 Rust `SyncTask` 结构体添加 `discovered_document_ids` 字段
- [x] 2.1 文档发现完成后存储已发现的文档 ID
- [x] 3.1 将 manifest 保存策略从批量改为逐文档
- [x] 4.1 更新 `DocumentSyncStatusTag` 显示"等待同步"
- [x] 5.1 验证 `AggregateSyncStatusTag` 行为正确（无需修改）
