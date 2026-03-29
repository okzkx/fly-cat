## Why

知识库树结构图中每个节点目前只显示标题和类型图标，用户无法直观了解每个文档/目录的同步状态。用户需要点击"查看任务列表"才能了解哪些文档已同步、哪些正在同步、哪些尚未同步，信息获取路径过长。需要在树节点旁直接展示同步状态，让用户一眼即可掌握全局同步进度。

## What Changes

- 在知识库树的每个文档节点标题右侧，显示一个紧凑的同步状态标签（Tag），包含三种状态：
  - **已同步**（绿色）：显示最近同步时间，如 "已同步 03-28 14:30"
  - **同步中**（蓝色 loading）：显示当前进度，如 "同步中 3/10"
  - **未同步**（灰色）：从未同步过的文档
- 仅对 document 类型节点显示同步状态，folder/space/bitable 不显示
- 同步状态数据来源于 manifest（已同步）和当前活跃任务（同步中）
- 浏览器模拟环境不显示同步状态标签

## Capabilities

### New Capabilities

（无）

### Modified Capabilities

- `knowledge-tree-display`: 树节点 `titleRender` 增加同步状态 Tag 显示；新增 `DocumentSyncStatus` 类型
- `knowledge-base-source-sync`: 新增 `get_document_sync_statuses` 后端命令，返回 `documentId -> { status, lastSyncedAt }` 映射

## Impact

- **前端类型** `src/types/sync.ts`: 新增 `DocumentSyncStatus` 接口
- **前端组件** `src/components/HomePage.tsx`: `titleRender` 增加同步状态 Tag
- **前端状态** `src/App.tsx`: 加载 `documentSyncStatuses` 并传递给 HomePage
- **前端 props** `src/types/app.ts`: `HomePageProps` 增加 `documentSyncStatuses` 字段
- **前端运行时** `src/utils/tauriRuntime.ts`: 新增 `getDocumentSyncStatuses` 函数
- **后端** `src-tauri/src/commands.rs`: 新增 `get_document_sync_statuses` Tauri 命令
- **后端注册** `src-tauri/src/lib.rs`: 注册新命令
