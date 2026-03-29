## Why

同步任务使用 8 并发批量处理文档（`concurrency = 8`），进度事件在每个 chunk 的所有线程 join 完成后才逐个发送。由于 8 个文档并行处理几乎同时完成，UI 刷新效果等同于"每 8 篇文章更新一次进度"，用户感知不到细粒度的同步进展。此外，当前 UI 只显示成功/跳过/失败的计数，没有展示"已处理 X / 总共 Y"的总数信息，用户无法直观评估剩余工作量。

## What Changes

- 将后端并发度从 8 降为 1，使每个文档同步完成后立即触发进度事件，UI 逐篇刷新
- 在前端同步任务列表的"统计"列中，增加"已处理 X / 共 Y"的文档总数显示，让用户一目了然地看到总进度

## Capabilities

### New Capabilities

（无）

### Modified Capabilities

- `knowledge-base-source-sync`: 同步进度事件从批量触发改为逐文档触发，并发策略从 8 并发改为串行；进度显示增加文档总数

## Impact

- **后端** `src-tauri/src/commands.rs`: `spawn_sync_progress` 函数中 `concurrency` 从 8 改为 1，移除 chunk 并行处理逻辑，改为逐文档串行处理并逐个 emit 进度事件
- **前端** `src/components/TaskListPage.tsx`: "统计"列增加"已处理 X / 共 Y"显示；同步端 `src/utils/browserTaskManager.ts` 的模拟进度也需同步调整显示格式
