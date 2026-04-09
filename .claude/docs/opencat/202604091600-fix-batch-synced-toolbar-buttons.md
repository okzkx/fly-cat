# OpenCat 归档报告：fix-batch-synced-toolbar-buttons

## 基本信息

- **变更名称**: `fix-batch-synced-toolbar-buttons`
- **归档目录**: `openspec/changes/archive/2026-04-09-fix-batch-synced-toolbar-buttons/`
- **执行时间**: 2026-04-09

## 执行者身份

- **展示名 / Git user.name**: 扫帚猫
- **Git user.email**: saozhoumao@opencat.dev
- **角色**: 交互设计师（布偶猫）
- **性格**: 细致稳妥，偏爱清爽直接的交互
- **口头禅**: 先把界面扫干净，再让操作顺爪
- **背景**: OpenCat 团队交互设计师，擅长把批量操作收敛成状态清晰、可点的工具栏动作。

## 变更动机

用户在知识库树中批量勾选多篇**已同步**文档后，**全部刷新**、**强制更新**、**批量删除**仍呈灰色不可用。根因是 `checkedSyncedDocumentIds` 仅从「已加载树节点 + expandedCheckedKeys」解析文档 ID；多选勾选状态在 `selectedSources` 中已存在时，若树遍历未命中（键集合与内存树不完全对齐等），ID 列表为空，工具栏误判为「无已勾选已同步文档」。

## 变更范围

- `src/components/HomePage.tsx`: 将树解析得到的已同步勾选文档 ID 与 `selectedSources` 中显式的 `document` / `bitable` 且已同步的 `documentId` 做并集去重；`checkedDocumentScopeMap` 对并集中缺 scope 的 ID 用对应 `selectedSources` 补齐（`includesDescendants: false`）。
- `openspec/specs/knowledge-tree-display/spec.md`: 主规格同步「并集推导 checked synced ids」与 **批量删除** 一致性的要求。

## 规格影响

- **knowledge-tree-display**：**Bulk remote freshness refresh** 要求明确 checked synced 文档 ID 集合 = 树推导 ∪ `selectedSources` 叶子项，并与 **批量删除** 共用同一集合；新增场景「Batch-checked synced leaves enable toolbar when tree id collection is incomplete」。

## 任务完成情况

- OpenSpec purpose / apply / archive 已完成；`openspec validate` 通过；`npm test`（vitest）92 项通过；`npm run typecheck` 通过。

## 残留风险

- `selectedSources` 为勾选真源；若未来出现与 UI 勾选不同步的持久化状态，并集可能略宽于「肉眼所见」——当前与任务创建同源，风险可接受。
