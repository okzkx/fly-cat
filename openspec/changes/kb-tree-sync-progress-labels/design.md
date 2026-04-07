## Context

首页知识库树使用 `NodeSyncStatusTag` 分流：文件夹/空间走 `AggregateSyncStatusTag`（同步中时展示 `同步中 processed/total`，与任务计数器一致）；文档/多维表格走 `DocumentSyncStatusTag`，发现集合内未落库项目前为「等待同步」。

## Approach

1. **叶子文档/表格（无已加载子节点）**  
   在 `syncingIds` 命中且尚无 manifest 状态时，复用聚合标签里「同步中」的展示：`<Tag color="processing">同步中 {processed}/{total}</Tag>`，`processed`/`total` 取自当前活动任务的 `counters`（与目录节点一致）。

2. **父文档/父表格（树上已有 `children`）**  
   将此类节点视为子树根，与文件夹相同走 `AggregateSyncStatusTag`：`collectDescendantDocumentIds` 已包含自身 `documentId` 与递归子节点，可继续用现有的 synced/failed/syncing 聚合与「同步中 X/Y」逻辑。

## Risks / limits

- 子节点尚未懒加载展开时，父节点只能看到自身文档是否在 `syncingIds` 中；子文档发现后仍会在各自叶子展示进度，与目录懒加载行为一致。

## Validation

- `npm run typecheck`、`npm run test`。
- 人工：有活动同步任务时，对比目录与文档行的标签样式均为「同步中 x/y」。
