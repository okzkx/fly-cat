# Tasks

## Task 1: 新增 DocumentSyncStatus 类型

在 `src/types/sync.ts` 中新增 `DocumentSyncStatus` 接口。

- [x] 1.1 在 `src/types/sync.ts` 末尾添加 `DocumentSyncStatus` 接口

## Task 2: 新增后端 get_document_sync_statuses 命令

在 Rust 后端新增 Tauri 命令，从 manifest 读取文档同步状态。

- [x] 2.1 在 `src-tauri/src/model.rs` 新增 `DocumentSyncStatusEntry` 结构体
- [x] 2.2 在 `src-tauri/src/commands.rs` 新增 `get_document_sync_statuses` 函数
- [x] 2.3 在 `src-tauri/src/lib.rs` 注册新命令

## Task 3: 前端加载同步状态数据

在 App.tsx 中加载并传递同步状态映射给 HomePage。

- [x] 3.1 在 `src/utils/tauriRuntime.ts` 新增 `getDocumentSyncStatuses` 函数
- [x] 3.2 在 `src/utils/taskManager.ts` 导出 `getDocumentSyncStatuses`
- [x] 3.3 在 `src/types/app.ts` 的 `HomePageProps` 中添加 `documentSyncStatuses` 字段
- [x] 3.4 在 `src/App.tsx` 中加载 `documentSyncStatuses` 并传递给 HomePage
- [x] 3.5 在任务进度事件触发时刷新 `documentSyncStatuses`

## Task 4: 树节点渲染同步状态标签

在 HomePage.tsx 的 titleRender 中为文档节点添加同步状态 Tag。

- [x] 4.1 接收 `documentSyncStatuses` 和当前活跃任务 props
- [x] 4.2 在 titleRender 中根据节点类型和同步状态显示对应 Tag
- [x] 4.3 处理已同步、失败、同步中、未同步四种状态
