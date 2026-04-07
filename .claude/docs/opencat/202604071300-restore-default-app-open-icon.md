# OpenSpec 归档报告：restore-default-app-open-icon

## 基本信息

- **变更名称**: `restore-default-app-open-icon`
- **归档目录**: `openspec/changes/archive/2026-04-07-restore-default-app-open-icon/`
- **基础分支**: `master`
- **任务分支**: `opencat/restore-default-app-open-icon`（合并后删除）

## 执行者身份

- **展示名 / Git user.name**: 回环猫
- **Git user.email**: huihuanmao@opencat.dev
- **角色**: OpenCat 界面向任务执行（知识库树细粒度操作）

## 变更动机

知识库树仅为「目录」节点展示了「使用默认应用打开」，文档与多维表格节点缺少同款入口，用户无法在桌面端一键用系统默认应用打开已同步的本地 Markdown，属于交互缺失/回归。

## 变更范围

- `src/services/path-mapper.ts`：新增 `mapSyncedMarkdownPathFromScope`，与 `mapDocumentPath` 对齐。
- `src-tauri/src/commands.rs`：`open_workspace_folder` 支持已存在的文件路径。
- `src/utils/tauriRuntime.ts`：更新 `openWorkspaceFolder` 文档说明。
- `src/components/HomePage.tsx`：文档/bitable 行内增加 FolderOpen 按钮，目录与文档共用 `handleOpenLocalWithDefaultApp`。
- `tests/path-mapper.test.ts`：Scope 与 Document 路径一致性单测。
- OpenSpec：`knowledge-tree-display` 主规格新增「文档与 bitable 默认应用打开」要求。

## 规格影响

- `openspec/specs/knowledge-tree-display/spec.md` 已合并 delta，新增一条 ADDED 需求及场景。

## 任务完成情况

- propose / apply / archive 三阶段提交按计划完成；`tasks.md` 全部勾选。
- 验证：`openspec validate`、`vitest`（path-mapper）、`cargo check`、`npm run build` 均已通过。

## 备注

- 未执行 `git push`（由上游队列负责）。
