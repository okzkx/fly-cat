## Context

`HomePage` 用 `syncingKeys` 驱动 `buildTreeNodes` 的 `disableCheckbox`。发现阶段结束后 `syncingKeys` 会覆盖到任务内所有文档节点；`documentSyncStatuses` 随 `TASK_EVENTS.progress` 刷新。当前实现不区分「仍在队列」与「本篇已成功」，导致已落盘文档仍被锁定。

## Goals / Non-Goals

**Goals:**

- 文档/多维表格叶子节点：一旦 `documentSyncStatuses[docId].status === "synced"`，在任务未结束时也允许勾选状态变更。
- 不改变空间、目录等聚合节点在任务进行中的锁定行为（避免与任务范围、半选展示冲突）。

**Non-Goals:**

- 不改动后端任务模型或同步引擎顺序。
- 不改变「已下载目录历史」对 checkbox 的既有禁用规则（`downloadedDocumentIds` 等）。

## Decisions

1. **在 `buildTreeNodes` 层解锁**  
   传入 `syncedDocumentIds`（由 `documentSyncStatuses` 派生）。对 `nodeKind` 为 `document` 或 `bitable` 且存在 `documentId` 的节点：`disableCheckbox = isSyncing && !syncedDocumentIds.has(documentId)`；其余节点保持 `disableCheckbox = isSyncing`。

2. **以 UI 同步状态为准**  
   与现有标签「已同步」一致，使用 `documentSyncStatuses` 而非单独猜测任务进度，避免与 manifest 不同步。

## Risks / Trade-offs

- **[Risk]** 用户在大任务进行中取消某已同步文档的勾选，后续任务仍可能按创建时的 `discoveredDocumentIds` 处理。  
  **→ Mitigation：** 与既有「任务范围在创建时固定」模型一致；若未来需动态收缩范围可另起变更。

- **[Risk]** 文件夹整选时，子文档提前解锁但父文件夹仍锁定，用户可能困惑。  
  **→ Mitigation：** 接受为有意折中；需求明确只针对「文档」粒度。

## Migration Plan

纯前端行为变更，无数据迁移。

## Open Questions

无。
