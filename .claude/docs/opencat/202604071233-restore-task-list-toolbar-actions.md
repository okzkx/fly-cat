# 归档：restore-task-list-toolbar-actions

## 基本信息

- **变更名称**: `restore-task-list-toolbar-actions`
- **归档目录**: `openspec/changes/archive/2026-04-07-restore-task-list-toolbar-actions/`
- **日期**: 2026-04-07

## 执行者

- **展示名 / Git user.name**: 扫帚猫
- **Git user.email**: saozhoumao@opencat.dev
- **角色**: OpenCat 交互向任务执行（任务列表工具栏修复）

## 变更动机

任务列表页 `Card` 使用与首页类似的 `title` 全宽 + `extra` 分栏样式时，在 Ant Design 6 的头部 flex 布局下，`extra` 区域易被挤出可视/裁剪范围，导致用户看不到「返回首页」「清空所有任务」等操作，并误以为「开始同步」类能力消失。

## 变更范围

- `src/components/TaskListPage.tsx`：将标题与工具栏合并为单行可换行 flex 容器（与首页卡片模式一致），移除对 `extra` 的依赖；新增主按钮「开始等待任务」（调用 `resumeSyncTasks`，无 pending 时禁用）。
- `openspec/specs/sync-focused-application-experience/spec.md`：新增「Task list header actions remain visible」需求。

## 规格影响

- **sync-focused-application-experience**: 新增任务列表页头部操作可见性与窄窗换行要求。

## 任务完成情况

- OpenSpec propose / apply / archive 流程已完成；`openspec validate` 通过；`npm run typecheck` 通过。

## 验证

- `openspec validate restore-task-list-toolbar-actions --type change`（归档前）
- `npm run typecheck`

## 残留风险

- 若未来再次为任务列表 `Card` 单独引入「title 100% + extra」组合，可能复发同类裁剪问题；建议与首页保持同一头部模式。
