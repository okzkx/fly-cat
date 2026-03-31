# 变更报告：任务列表一键清空

## 基本信息

- **变更名称**: add-clear-all-sync-tasks-button
- **类型**: 前端交互 + Tauri 命令

## 变更动机

为同步任务列表提供一次性清空能力，避免逐条删除，交互更直接。

## 变更范围

- `TaskListPage`：卡片标题栏增加带二次确认的「清空所有任务」按钮（列表为空时禁用）。
- Rust：`clear_all_sync_tasks` 清空持久化任务列表并清空 `running_task_ids`。
- 浏览器路径：`browserTaskManager.clearAllSyncTasks` 清理定时器并写入空列表。
- 主规格 `sync-focused-application-experience`：新增「Task list bulk clear」需求。

## 规格影响

- 已把 delta 中的新增需求合并进 `openspec/specs/sync-focused-application-experience/spec.md`。

## 任务完成情况

- Purpose / Design / Specs / Tasks 均已完成；实现与 `tasks.md` 勾选一致。

## 验证

- `openspec validate add-clear-all-sync-tasks-button --type change` 通过
- `cargo check`（src-tauri）通过
- `npm test`（vitest）全部通过
- `npm run build` 因仓库既有 `tests/run-tauri.test.ts` 与 `tsc -b` 配置冲突失败（与本次改动无关）
