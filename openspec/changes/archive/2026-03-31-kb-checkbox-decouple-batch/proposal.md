## Why

知识库树中复选框与「是否已同步」绑定后，用户容易把勾选状态误认为同步状态；取消勾选还会在「开始同步」时触发删除，与「用勾选做批量操作」的心智不一致。需要让勾选仅表示批量意图，同步状态只由标签等展示。

## What Changes

- 复选框默认不与 manifest 同步状态合并；未勾选为默认，已同步仅由节点旁状态标签展示。
- 「开始同步」仅根据当前勾选的同步源创建任务，不再在启动前按「未勾选已同步文档」批量删除。
- 新增「批量删除」操作：对当前勾选范围内、且本地已成功同步的文档调用 `removeSyncedDocuments`，删除后刷新状态。
- 保留三态父子联动与同步中/等待中禁用复选框；移除 `uncheckedSyncedDocKeys` 及相关规格描述。

## Capabilities

### New Capabilities

（无独立新能力名；行为归入既有能力修订。）

### Modified Capabilities

- `synced-doc-checkbox`: 勾选与同步状态脱钩、删除「默认勾选已同步」「开始同步前删未勾选」、增加「批量删除已勾选已同步」、更新三态场景中不再引用 `uncheckedSyncedDocKeys`。
- `knowledge-base-source-sync`: 删除「开始同步前删除未在勾选集合中的已同步文档」场景，与前端行为一致。

## Impact

- `src/components/HomePage.tsx`、`src/App.tsx`、`src/types/app.ts`
- 移除 `src/utils/syncStart.ts` 及对 `shouldSkipTaskCreationAfterCleanup` 的测试与引用
