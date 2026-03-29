# 变更报告：fix-sync-task-list-freeze

## 基本信息

- **变更名称**：fix-sync-task-list-freeze
- **归档路径**：`openspec/changes/archive/2026-03-29-fix-sync-task-list-freeze/`
- **Schema**：spec-driven

## 变更动机

用户点击"开始同步"后进入任务列表页面，页面会卡住数秒才显示正在进行的任务。参考工程 `feishu_docs_export` 中不存在此问题。

根本原因是 `App.tsx` 中 `onCreateTask` 按顺序 await 了三个操作：`createSyncTask`（后端文档发现）、`startSyncTask`（启动同步）、`getSyncTasks`（刷新列表）。其中 `createSyncTask` 的文档发现阶段可能耗时数秒，导致整个流程阻塞。而 `TaskListPage` 组件独立管理任务状态，初始为空，导航到该页面时需要额外请求后端才能显示任务。

## 变更范围

- **src/types/app.ts**：`TaskListPageProps` 新增可选 `initialTasks` 属性
- **src/components/TaskListPage.tsx**：使用 `initialTasks` 初始化任务列表，避免空渲染
- **src/App.tsx**：`startSyncTask` 改为 fire-and-forget（不 await），`setTasks` 提前到同步启动之前执行，`tasks` 作为 `initialTasks` 传递给 `TaskListPage`

## Spec 影响

- `sync-focused-application-experience`：新增 1 条 requirement（任务列表即时显示）

## 任务完成

4/4 任务已完成：
1. 更新 `TaskListPageProps` 接口
2. `TaskListPage` 使用 `initialTasks` 初始化
3. `App.tsx` 传递 `tasks` 给 `TaskListPage`
4. `startSyncTask` 改为 fire-and-forget
