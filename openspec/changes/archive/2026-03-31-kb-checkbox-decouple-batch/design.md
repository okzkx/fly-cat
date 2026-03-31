## Context

`HomePage` 将 `selectedSources` 的 key 与 `syncedDocTreeKeys` 合并为 `allCheckedKeys`，并用 `uncheckedSyncedDocKeys` 表达用户取消默认勾选。`App.onCreateTask` 在创建任务前对未勾选已同步文档调用 `removeSyncedDocuments`。

## Decisions

1. **勾选数据源唯一**：`allCheckedKeys` 仅来自 `selectedSources` 对应的 `checkedSourceKeys`（`Set`），不再合并 manifest 推导的已同步 key。
2. **删除语义外移**：不再在「开始同步」路径调用 `removeSyncedDocuments`；新增独立按钮，仅删除「勾选范围内且 `documentSyncStatuses` 为 synced」的文档 ID（排除正在同步/等待中的文档 ID）。
3. **状态精简**：删除 `uncheckedSyncedDocKeys` 及基于 `documentSyncStatuses` 的副作用重置逻辑。
4. **API**：`onCreateTask` 改为无参；新增 `onBatchDeleteCheckedSyncedDocuments(documentIds: string[])`。

## Non-Goals

- 不改 Rust 后端与 `removeSyncedDocuments` 实现。
- 不改动三态点击循环算法（`computeCascadedCheckedKeys` 等），仅去掉与 `uncheckedSyncedDocKeys` 的耦合。
