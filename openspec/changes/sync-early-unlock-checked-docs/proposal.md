## Why

大批量同步时，界面按任务维度锁定已选节点的 checkbox，用户必须等整批任务结束才能改选区；单篇文档已写入成功时仍被当作「同步中」锁定，体验僵硬。应在单篇成功落盘后即时恢复该文档的可勾选状态。

## What Changes

- 活跃同步任务（pending/syncing）期间，**已成功同步**的文档/多维表格节点不再禁用 checkbox；尚未完成或失败的节点仍保持锁定。
- 目录、知识库等聚合节点的锁定规则不变（仍按现有「选中范围在任务内则锁定」逻辑），避免半选状态与任务范围不一致。
- 主规格 `sync-focused-application-experience` 中「Checkbox Locking During Active Sync」相关场景增补：按文档粒度在成功同步后解锁。

## Capabilities

### New Capabilities

_(无)_

### Modified Capabilities

- `sync-focused-application-experience`: 在活跃任务未结束时，已成功同步的文档节点应可再次勾选/取消勾选。

## Impact

- `src/components/HomePage.tsx`: `buildTreeNodes` / `buildTreeData` 传入已同步文档集合，文档类节点在 `documentSyncStatuses` 为 `synced` 时不应用同步锁定。
- 无后端变更；依赖现有进度事件刷新 `documentSyncStatuses` 的行为。
