# 变更报告：disable-downloaded-doc-selection

## 基本信息

| 项目 | 内容 |
|------|------|
| 变更名称 | disable-downloaded-doc-selection |
| Schema | opencat-change/v1 |
| 归档路径 | openspec/changes/archive/2026-03-29-disable-downloaded-doc-selection/ |

## 变更动机

知识库树形列表中，已下载的文档与未下载的文档在视觉上无区别，用户无法辨别哪些文档已经同步到本地，导致重复选择和浪费时间。

## 变更范围

- 后端：新增 `get_synced_document_ids` Tauri 命令，从 manifest 中提取已成功同步的文档 ID
- 前端：新增 `getSyncedDocumentIds()` 函数，在应用启动时加载已下载文档 ID 集合
- 界面：知识库树中已下载文档的复选框自动禁用，防止重复选择

## 规格影响

- MODIFIED: `tree-document-disable` — 已下载文档的复选框禁用逻辑

## 任务完成情况

- [x] 1. 添加 `get_synced_document_ids` Tauri 命令
- [x] 2. 添加 `getSyncedDocumentIds()` 前端函数（含浏览器模式回退）
- [x] 3. App.tsx 中加载已下载文档 ID 状态
- [x] 4. HomePage 集成下载状态到树节点禁用逻辑

## 修改文件

| 文件 | 变更类型 |
|------|----------|
| src-tauri/src/commands.rs | 新增命令 |
| src-tauri/src/lib.rs | 注册命令 |
| src/utils/tauriRuntime.ts | 新增前端 API 函数 |
| src/utils/taskManager.ts | 新增导出 |
| src/App.tsx | 新增状态和加载逻辑 |
| src/components/HomePage.tsx | 禁用逻辑集成 |
| src/types/app.ts | 类型扩展 |
