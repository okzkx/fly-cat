# 归档报告：decouple-document-preview-from-checkbox-selection

## 基本信息

- **变更名称：** `decouple-document-preview-from-checkbox-selection`
- **归档目录：** `openspec/changes/archive/2026-04-07-decouple-document-preview-from-checkbox-selection/`
- **完成日期：** 2026-04-07

## 执行者身份

- **展示名 / Git user.name：** 勾勾猫
- **Git user.email：** gougoumao@opencat.dev
- **角色：** OpenCat 交互设计向实现；本任务聚焦知识树勾选与预览职责拆分。

## 变更动机

原先在知识库树中，点击文档标题会同时触发同步复选框状态切换，且勾选复选框会更新「当前选中范围」从而驱动右侧 Markdown 预览。用户需要：**点标题只为预览**，**勾复选框只为纳入/移出同步范围**，二者互不替代。

## 变更范围

- **`src/components/HomePage.tsx`**
  - `handleSelect`：仅在有 `scopeValue` 且事件非来自 `.ant-tree-checkbox` 时调用 `onScopeChange`；不再调用 `handleTriStateToggle`。
  - `handleTriStateToggle`：删除勾选时同步 `onScopeChange` 的逻辑；移除已无用的 `computeCascadedCheckedKeys` 调用与 import。
- **OpenSpec：** 已归档并合并主规格 `knowledge-tree-display`、`knowledge-doc-markdown-preview`。

## 规格影响

- 新增：`knowledge-tree-display` 下「文档行区分预览选择与同步复选框」要求。
- 修改：`knowledge-doc-markdown-preview` 明确预览跟随标题行聚焦选择，而非仅靠复选框。

## 任务完成情况

- propose / apply / archive 三阶段提交已完成；`openspec validate` 通过；`npm run build` 通过。

## 口头禅

勾上要稳，取消也得顺爪——预览跟标题，勾选管同步，各走各路。
