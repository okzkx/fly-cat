# 变更报告：knowledge-tree-sync-status

## 基本信息

- **变更名称**：knowledge-tree-sync-status
- **归档路径**：openspec/changes/archive/2026-03-29-knowledge-tree-sync-status/

## 变更动机

知识库树结构图中每个节点仅显示标题和类型图标，用户无法直观了解每个文档的同步状态。需要在树节点旁直接展示同步状态，让用户一眼即可掌握全局同步进度。

## 变更范围

### 前端

- `src/types/sync.ts`：新增 `DocumentSyncStatus` 接口
- `src/types/app.ts`：`HomePageProps` 增加 `documentSyncStatuses` 和 `activeSyncTask` 字段
- `src/components/HomePage.tsx`：树节点 `titleRender` 为文档节点添加同步状态 Tag，支持已同步（绿色）、同步失败（红色）、同步中（蓝色）、未同步（灰色）四种状态
- `src/App.tsx`：加载 `documentSyncStatuses` 并在任务事件触发时刷新，传递给 HomePage
- `src/utils/tauriRuntime.ts`：新增 `getDocumentSyncStatuses` 函数
- `src/utils/taskManager.ts`：导出 `getDocumentSyncStatuses`

### 后端

- `src-tauri/src/model.rs`：新增 `DocumentSyncStatusEntry` 结构体
- `src-tauri/src/commands.rs`：新增 `get_document_sync_statuses` Tauri 命令
- `src-tauri/src/lib.rs`：注册新命令

## 规格影响

- **knowledge-tree-display**：修改 - 树节点增加同步状态 Tag 显示
- **knowledge-base-source-sync**：新增 - 提供 `get_document_sync_statuses` 命令

## 任务完成情况

| 任务 | 状态 |
|------|------|
| Task 1: 新增 DocumentSyncStatus 类型 | 完成 |
| Task 2: 新增后端命令 | 完成 |
| Task 3: 前端加载同步状态数据 | 完成 |
| Task 4: 树节点渲染同步状态标签 | 完成 |
