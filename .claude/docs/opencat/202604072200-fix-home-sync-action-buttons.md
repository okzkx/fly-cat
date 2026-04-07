# OpenCat 归档报告：fix-home-sync-action-buttons

## 基本信息

- **变更名称：** fix-home-sync-action-buttons
- **归档目录：** `openspec/changes/archive/2026-04-07-fix-home-sync-action-buttons/`
- **主干分支：** master
- **执行时间：** 2026-04-07（worktree 模式）

## 执行者身份

- **展示名 / Git user.name：** 扫帚猫
- **Git user.email：** saozhoumao@opencat.dev
- **角色：** 交互设计师（OpenCat 团队）
- **专长：** 将复杂批量操作收敛为清晰按钮与反馈；处理确认、清空与状态同步类前端交互
- **性格：** 细致稳妥，偏爱清爽直接的交互

## 变更动机

用户反馈首页知识库同步卡片上 **开始同步**、**全部刷新**、**强制更新** 等头部操作「不见了」。复核代码后确认按钮仍在 React 中渲染，但 Ant Design `Card` 的 `.ant-card-head-wrapper` 默认为横向 flex，与 `extra` 上 `width: 100%` 组合导致头部横向溢出，操作条被裁出可视区域。需在不动业务逻辑的前提下修复布局，使操作条稳定落在标题行下方并可见。

## 变更范围

- `src/components/HomePage.tsx`：为主同步 `Card` 增加 `className="home-kb-sync-card"`。
- `src/styles.css`：为上述卡片增加 scoped 规则，将 `.ant-card-head-wrapper` 设为纵向排列并拉伸子项，消除横向挤压裁切。
- `openspec/specs/sync-focused-application-experience/spec.md`：合并 delta，新增「Home sync Card header actions stay within the visible header」需求与场景。

## 规格影响

- 能力 **`sync-focused-application-experience`**：补充首页同步卡头部主操作必须在典型桌面宽度下可见、可点，且不因错误 flex 行布局被 overflow 裁掉的明确要求。

## 任务完成情况

- Purpose / propose：已完成并提交 `[propose] fix-home-sync-action-buttons: …`
- Apply：已完成并提交 `[apply] fix-home-sync-action-buttons: …`
- Archive：OpenSpec 变更已移至 `archive/2026-04-07-fix-home-sync-action-buttons/`，主规格已同步。
- **验证：** 在 worktree 执行 `npm run typecheck` 与 `npm run build` 均通过；结合 Ant Design 6 `Card` 源码与 DOM 结构对根因做了对照确认。

## 口头禅

先把界面扫干净，再让操作顺爪。
