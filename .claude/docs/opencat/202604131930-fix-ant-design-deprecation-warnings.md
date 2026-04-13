# OpenCat 归档报告：fix-ant-design-deprecation-warnings

## 基本信息

- **变更名称**: fix-ant-design-deprecation-warnings
- **归档日期**: 2026-04-13
- **基础分支**: master
- **任务分支**: opencat/fix-ant-design-deprecation-warnings
- **Worktree 槽位**: F:/okzkx/feishu_docs_sync-worktree

## 执行者身份

- **展示名 / Git user.name**: 回环猫
- **Git user.email**: huihuanmao@opencat.dev
- **品种**: 暹罗猫
- **角色**: 界面魔法师
- **经历**: 回环猫是 OpenCat 团队的界面魔法师。它擅长给复杂列表增加细粒度的操作入口，曾把一整页笨重的批量操作拆解成直观的单项动作，让用户只需轻轻一点就能重新触发精确流程。它对按钮位置、反馈时机和状态联动尤其敏感。
- **性格**: 机敏专注，偏爱小而准的交互设计
- **习惯用语**: 轻点一下，流程再转一圈

## 变更动机

Ant Design 6 弃用 `Space.direction` 与 `Spin.tip`，开发控制台会持续出现弃用告警。统一改为 `orientation` 与 `description` 可消除噪音，且不改变布局与交互语义。

## 变更范围

- `src/components/HomePage.tsx`、`TaskListPage.tsx`、`SettingsPage.tsx`、`AuthPage.tsx`：`Space` 的 `direction="vertical"` → `orientation="vertical"`。
- `src/components/MarkdownPreviewPane.tsx`：`Spin` 的 `tip` → `description`。
- OpenSpec：变更已归档至 `openspec/changes/archive/2026-04-13-fix-ant-design-deprecation-warnings/`；主规格 `openspec/specs/reference-app-shell-alignment/spec.md` 已合并新增需求段落。

## 规格影响

- **reference-app-shell-alignment**：新增「Ant Design 布局与加载组件避免弃用属性」需求及对应场景。

## 任务完成情况

- Purpose / Apply / Archive 三阶段提交均已完成；实现与 `tasks.md` 勾选一致。
- 在 worktree 内执行 `npm run typecheck` 通过。
