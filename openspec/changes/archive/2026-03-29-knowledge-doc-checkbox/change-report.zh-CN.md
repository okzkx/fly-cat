# 变更报告：knowledge-doc-checkbox

## 基本信息

- **变更名称**: knowledge-doc-checkbox
- **架构模式**: spec-driven
- **归档路径**: openspec/changes/archive/2026-03-29-knowledge-doc-checkbox/

## 变更动机

用户同步完文档后再次打开知识库目录，无法直观看到哪些文档已经同步过，也无法方便地移除不再需要的已同步文档。需要在知识库树中为已同步文档提供默认打勾状态，并支持通过取消打勾来标记待删除文档。

## 变更范围

- **前端 `HomePage.tsx`**: 新增 `uncheckedSyncedDocKeys` 状态追踪用户主动取消打勾的已同步文档；`allCheckedKeys` 合并用户选中与默认已同步文档的打勾状态；`onCheck` 处理器支持已同步文档的取消打勾和重新打勾
- **前端 `App.tsx`**: `onCreateTask` 回调在创建同步任务前调用 `removeSyncedDocuments` 清理未勾选的已同步文档，并在清理后刷新同步状态
- **前端 `types/app.ts`**: `HomePageProps.onCreateTask` 签名增加 `uncheckedSyncedDocumentIds` 参数
- **前端 `tauriRuntime.ts`**: 新增 `removeSyncedDocuments` 前端桥接函数
- **前端 `taskManager.ts`**: 导出 `removeSyncedDocuments`
- **后端 `commands.rs`**: 新增 `remove_synced_documents` Tauri 命令和 `clean_empty_dirs` 辅助函数
- **后端 `storage.rs`**: 新增 `remove_manifest_records` 函数
- **后端 `lib.rs`**: 注册 `remove_synced_documents` 命令

## 规格影响

- **新增规格 `synced-doc-checkbox`**: 已同步文档默认打勾、取消打勾删除、同步中禁用 checkbox
- **修改规格 `knowledge-base-source-sync`**: 同步任务创建前自动清理未勾选的已同步文档

## 任务完成情况

11/11 任务已完成：
- 前端状态管理（3 项）
- 同步启动清理流程（4 项）
- 同步中 checkbox 禁用验证（2 项）
- 边界情况处理（2 项）
