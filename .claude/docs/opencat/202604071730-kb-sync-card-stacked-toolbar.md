# 变更报告：知识库同步与任务列表卡片头部分行

**变更名：** `kb-sync-card-stacked-toolbar`  
**执行身份：** 扫帚猫（交互设计师·布偶猫）  
**日期：** 2026-04-07  

## 背景与目标

首页「飞猫助手知识库同步」卡片与「飞猫助手任务列表」卡片原先使用 Ant Design `Card` 默认头布局，标题与右侧 `extra` 操作区在同一行，视觉上拥挤、不易扫读。本次将标题区与操作按钮区改为上下分行：第一行保留标题（首页可同时保留任务摘要入口），第二行整宽右对齐（可换行）展示主要操作按钮。

## 实现摘要

- `HomePage.tsx`：为同步主卡片增加 `styles.header` 纵向排列，并调整 `title` / `extra` 宽度与对齐，使「全部刷新 / 强制更新 / 批量删除 / 开始同步」位于标题行下方。
- `TaskListPage.tsx`：采用相同模式，并为 `extra` 内 `Space` 增加 `wrap` 与间距，窄窗下按钮可折行。

## 规格与归档

- OpenSpec 增量已合并至 `openspec/specs/sync-focused-application-experience/spec.md`（新增「Primary Card toolbars separated from titles」要求）。
- 变更目录已归档至 `openspec/changes/archive/2026-04-07-kb-sync-card-stacked-toolbar/`。

## 验证

- 已执行 `npm run build`（`tsc -b` + `vite build`），通过。

## 残留风险

- 依赖 Ant Design `Card` 的 `styles` API；若未来大版本调整头部 DOM 结构，需回归视觉。垂直方向头部高度略增，属预期代价。
