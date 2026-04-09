# fix-pending-sync-task-start — 归档报告

## 基本信息

- **变更名称**: `fix-pending-sync-task-start`
- **归档目录**: `openspec/changes/archive/2026-04-09-fix-pending-sync-task-start/`
- **日期**: 2026-04-09 15:32

## 执行者

- **展示名 / Git user.name**: 回环猫
- **Git user.email**: huihuanmao@opencat.dev
- **角色**: 界面魔法师
- **品种**: 暹罗猫
- **性格**: 机敏专注，偏爱小而准的交互设计
- **口头禅**: 轻点一下，流程再转一圈

## 变更动机

同步任务的“开始”链路被拆成了两种不一致的入口：首页创建后是 fire-and-forget，任务列表单项开始又走批量恢复。这样一来，只要启动请求在创建后失败，任务就会停在 `pending/preparing`，界面却可能已经提示“已开始”，用户再点单项开始也没有走最直接的任务启动路径。

## 变更范围

- `src/App.tsx`：把首页 create-and-start 流程收敛为“先插入本地任务，再 await 直接启动”，确保只有真正发起启动成功后才返回成功链路。
- `src/components/TaskListPage.tsx`：把 pending 行的开始按钮改成按 task id 直接启动当前任务，不再借道 `resumeSyncTasks()`。
- `src/utils/syncTaskWorkflow.ts`：新增小型启动工作流工具，统一“创建后启动”和“按 id 启动”的语义。
- `tests/sync-task-workflow.test.ts`：补充聚焦测试，锁定创建后直接启动、排队不启动、按 id 启动三种行为。
- `openspec/specs/sync-focused-application-experience/spec.md`：修改任务启动规范，移除 fire-and-forget 要求，明确启动失败必须显式反馈。

## 规格影响

- `sync-focused-application-experience` 现在明确要求：首页创建任务后必须直接调用并等待该任务的启动请求，不能在启动失败时仍向用户报告“已开始”。
- 同一规格同时明确：任务列表里的单项 pending 开始按钮必须直接启动当前任务，而不是依赖批量恢复路径。

## 任务完成情况

- OpenSpec propose / apply / archive 流程已完成。
- `openspec archive "fix-pending-sync-task-start" -y` 已执行，并已将 delta spec 合并回主规格。

## 验证

- 代码复核确认根因：任务创建后的启动是 fire-and-forget，单项开始按钮又没有直接调用 `startSyncTask(taskId)`，导致“已提示开始”与“实际未开始”之间出现缝隙。
- `npm test -- sync-task-workflow.test.ts`
- `npm run typecheck`
- `openspec validate "fix-pending-sync-task-start" --type change`

## 剩余风险

- 这次修复只统一了前端启动入口，没有改 Tauri 后端的任务状态机；如果后续发现 `start_sync_task` 自身仍会在某些授权/状态边界留下 `pending` 任务，需要再向后端继续收敛。
