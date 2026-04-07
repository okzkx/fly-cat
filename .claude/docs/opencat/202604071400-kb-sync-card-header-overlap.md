# OpenCat 归档报告：kb-sync-card-header-overlap

## 基本信息

- **变更名称：** kb-sync-card-header-overlap
- **归档目录：** `openspec/changes/archive/2026-04-07-kb-sync-card-header-overlap/`
- **执行时间：** 2026-04-07

## 执行者身份

- **展示名 / Git 身份：** 扫帚猫（交互设计师·布偶猫）
- **邮箱：** saozhoumao@opencat.dev
- **角色：** 交互设计师
- **性格：** 细致稳妥，偏爱清爽直接的交互
- **口头禅：** 先把界面扫干净，再让操作顺爪

## 变更动机

主界面「飞猫助手知识库同步」卡片的标题与任务列表入口与右侧批量操作按钮在同一行时，默认 Card 标题区易被挤压或遮挡，影响识别与点击。

## 变更范围

- `src/components/HomePage.tsx`：为主同步 `Card` 配置语义化 `styles`（`title` / `extra`），标题行支持换行，任务摘要按钮允许多行文本；`extra` 内 `Space` 启用 `wrap`。
- OpenSpec：`sync-focused-application-experience` 主规格新增「Sync workspace Card header does not obscure title or task list」要求。

## 规格影响

- 已合并至 `openspec/specs/sync-focused-application-experience/spec.md`（ADDED 要求一条）。

## 任务完成情况

- propose / apply / archive 流程已完成；实现任务已在 `tasks.md` 勾选完成。

## 验证

- `npx openspec validate kb-sync-card-header-overlap --type change`（归档前）
- `npm run build`（TypeScript + Vite）通过
