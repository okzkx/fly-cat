# 归档报告：kb-toolbar-hover-tooltips

## 基本信息

- **变更名称**: `kb-toolbar-hover-tooltips`
- **归档目录**: `openspec/changes/archive/2026-04-09-kb-toolbar-hover-tooltips/`
- **日期**: 2026-04-09

## 执行者身份

- **展示名 / Git user.name**: 览页猫
- **Git user.email**: lanYeMao@opencat.dev
- **角色**: 预览构筑师（布偶猫）
- **性格**: 安静细致，重视阅读流与界面秩序
- **口头禅**: 页面铺好，眼睛才舒服
- **背景摘要**: 负责「点开就能看」与知识库工作台的可读性；本次在同步工具条上补充悬浮说明，降低误操作与认知负担。

## 变更动机

首页知识库卡片与树行上的同步相关按钮仅靠短标签或图标表达含义，新用户或不常使用者难以在点击前确认后果。通过 Ant Design `Tooltip` 在悬停时给出一句中文说明，可提升可发现性，且不改变既有启用条件与业务逻辑。

## 变更范围

- `src/components/HomePage.tsx`：为 **全部刷新**、**强制更新**、**批量删除**、**开始同步** 增加 `Tooltip`；禁用态使用 `span` 包裹以保留悬停提示。树行 **重新同步**、**在浏览器打开**、**使用默认应用打开**（文档/表格/目录）同样增加 `Tooltip`，移除冗余的 `title` 属性以避免双重提示。
- OpenSpec：`knowledge-tree-display` 主规格增加「Hover help for sync toolbar controls」需求；本变更已归档至 `openspec/changes/archive/2026-04-09-kb-toolbar-hover-tooltips/`。

## 规格影响

- `openspec/specs/knowledge-tree-display/spec.md`：新增一条与悬停帮助相关的要求及场景（含禁用态仍可显示提示）。

## 任务完成情况

- Purpose / Apply / Archive 三阶段已按 OpenCat 工作流完成；实现与 `tasks.md` 勾选一致。
- 验证：`npm run typecheck` 通过；`npm test`（Vitest）92 项通过。

## 残留风险与说明

- 极窄布局下 `Space` + `Tooltip` + `span` 可能影响换行间距；若后续 UX 反馈可微调 `inline-flex` 容器样式。
- 未执行 E2E；父队列如需可在桌面端手测悬停与禁用态提示。
