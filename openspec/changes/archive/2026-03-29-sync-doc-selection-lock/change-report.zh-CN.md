# 变更报告：sync-doc-selection-lock

## 基本信息

- **变更名称**：sync-doc-selection-lock
- **Schema**：spec-driven
- **归档路径**：openspec/changes/archive/2026-03-29-sync-doc-selection-lock/

## 变更动机

用户点击"开始同步"后，已勾选的文档仍然可以取消勾选，可能导致正在同步的文档被移出选择范围，造成认知混淆。需要在同步任务创建后立即锁定已选文档的 checkbox 状态。

## 变更范围

- 修改 `src/components/HomePage.tsx` 中的 `buildTreeNodes` 和 `buildTreeData` 函数，增加 `syncingKeys` 参数
- 在 `HomePage` 组件中根据 `activeSyncTask` 计算同步锁定 key 集合
- 同步激活期间，已勾选节点的 checkbox 变为不可操作

## Spec 影响

- `sync-focused-application-experience`：新增 "Checkbox Locking During Active Sync" 需求（ADDED）

## 任务完成情况

- Task 1：为 `buildTreeNodes` 和 `buildTreeData` 添加 `syncingKeys` 参数 ✓
- Task 2：从 `activeSyncTask` 计算 `syncingKeys` 并传递 ✓
