# 变更报告：知识库文档本地/远端飞书版本号展示

## 基本信息

- **变更名称**: kb-doc-feishu-version-labels
- **归档日期**: 2026-03-31
- **基础分支**: master

## 执行者身份

- **姓名**: 回环猫
- **品种**: 暹罗猫
- **职业**: 界面魔法师
- **性格**: 机敏专注，偏爱小而准的交互设计
- **口头禅**: 轻点一下，流程再转一圈
- **邮箱**: huihuanmao@opencat.dev

## 变更动机

用户需要在知识库树中直接对比「上次同步记录的飞书修订号」与「当前远端修订号」，以便判断是否需要重新同步；原先仅有新鲜度图标，信息不够直观。

## 变更范围

- `src-tauri/src/model.rs`：`DocumentSyncStatusEntry` 增加 `local_feishu_version`（来自 manifest `version`）。
- `src-tauri/src/commands.rs`：`get_document_sync_statuses` 填充本地版本；`KnowledgeBaseNode` 增加 `wiki_list_version`（来自 wiki 子节点列表）；OpenAPI 树构建与 fixture 同步更新。
- `src/types/sync.ts`、`src/utils/tauriRuntime.ts`：前端类型与 invoke 返回类型。
- `src/components/HomePage.tsx`：文档与 bitable 行展示 `本地 … / 远端 …` 次要文案；融合 `freshnessMap` 与列表版本回退逻辑。
- `openspec/specs/knowledge-tree-display/spec.md`：合并新增需求。

## 规格影响

- `knowledge-tree-display`：新增「Document and bitable nodes show local and remote Feishu revision labels」需求。

## 任务完成情况

- 后端字段、前端展示、规格合并、`cargo test` / `npm test` / `openspec validate` 均已完成。
