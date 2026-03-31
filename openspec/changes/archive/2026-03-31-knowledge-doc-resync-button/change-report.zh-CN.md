# 变更报告：知识库文档行内重新同步

## 基本信息

- **变更名称**: knowledge-doc-resync-button
- **归档日期**: 2026-03-31
- **基础分支**: master

## 变更动机

在知识库树中为文档/多维表格行提供显式「重新同步」入口，避免用户仅为单篇文档更新而重复配置整批同步范围。

## 变更范围

- `src/types/app.ts`：`HomePageProps` 新增 `onResyncDocumentScope`。
- `src/App.tsx`：实现单 scope 重新同步（可选 `removeSyncedDocuments`、`normalizeSelectedSources`、`createSyncTask`、`startSyncTask`、刷新任务列表与同步状态）。
- `src/components/HomePage.tsx`：文档与 bitable 行展示 `ReloadOutlined` 文本按钮，含禁用/加载与成功失败提示。
- `openspec/changes/archive/...`：提案、设计、规格增量与任务清单归档。
- `tests/run-tauri.test.ts`：为 mock 子进程补充类型断言，消除 `tsc -b` 报错（与本次构建验证相关）。

## 规格影响

- `knowledge-tree-display`：新增「Per-document re-sync control」需求（delta 规格随变更归档）。

## 任务完成情况

- 类型与 App 接线、树 UI、校验与构建均已完成。
