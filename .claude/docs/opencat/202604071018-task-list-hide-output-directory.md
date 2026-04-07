# OpenCat 归档报告：task-list-hide-output-directory

## 基本信息

- **变更名称：** task-list-hide-output-directory
- **归档目录：** `openspec/changes/archive/2026-04-07-task-list-hide-output-directory/`
- **执行日期：** 2026-04-07
- **模式：** 分支模式（branch）

## 执行者身份

- **展示摘要：** 回环猫（界面魔法师·暹罗猫）
- **Git user.name：** 回环猫
- **Git user.email：** huihuanmao@opencat.dev
- **角色：** 前端 / 列表交互，擅长列表 UI 与状态联动
- **风格提示：** 轻点一下，流程再转一圈

## 变更动机

飞猫助手任务列表中原先以独立列和展开行重复展示每条任务的本地输出目录，信息密度高、对日常查看进度帮助有限；用户已在创建同步时确认输出位置。隐藏列表中的输出目录展示，使界面更聚焦于范围、进度与状态。

## 变更范围

- `src/components/TaskListPage.tsx`：移除「输出目录」列；移除展开行中的输出目录文案。
- `openspec/specs/sync-focused-application-experience/spec.md`：通过 OpenSpec archive 合并新增需求「Task list omits output directory display」。
- OpenSpec 变更已归档至 `openspec/changes/archive/2026-04-07-task-list-hide-output-directory/`。

## 规格影响

- 同步体验规格增加约束：任务列表页不得以表格列或展开详情形式展示 per-task 输出路径；不影响 `SyncTask` 数据字段及其他配置入口。

## 任务完成情况

- Purpose / propose：已完成并提交。
- Apply：已完成 UI 修改与 `tasks.md` 勾选，已提交。
- 校验：`openspec validate task-list-hide-output-directory --type change`（归档前）；`npm run typecheck` 通过。
- Archive：`openspec archive task-list-hide-output-directory -y` 成功，主规格已更新。

## 验证

- `openspec validate`（变更有效）
- `npm run typecheck` 通过
