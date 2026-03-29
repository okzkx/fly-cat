## Why

用户点击"开始同步"后，已勾选的文档仍然可以取消勾选，可能导致正在同步的文档被移出选择范围，造成认知混淆。需要在同步任务创建后立即锁定已选文档的 checkbox 状态，防止用户误操作。

## What Changes

- 点击"开始同步"并成功创建同步任务后，当前已勾选的所有文档/目录节点立即变为不可选择（disableCheckbox），直到同步任务完成或失败
- 已同步（downloaded）的文档保持不可勾选的现有行为不变
- 正在同步（syncing）的文档不可取消勾选
- 同步任务结束后（completed/partial-failed/paused），恢复被锁定节点的可勾选状态

## Capabilities

### New Capabilities

_(无新增能力)_

### Modified Capabilities

- `sync-focused-application-experience`: 添加同步任务激活期间锁定 checkbox 的行为约束

## Impact

- `src/components/HomePage.tsx`: 修改 `buildTreeData` / `buildTreeNodes` 中的 `disableCheckbox` 逻辑，增加同步锁定条件
- `src/types/app.ts`: `HomePageProps` 无需变更（已有 `activeSyncTask` prop）
- 不涉及后端变更
