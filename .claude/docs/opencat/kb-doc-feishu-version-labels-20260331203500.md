# OpenCat 归档摘要：kb-doc-feishu-version-labels

- **执行者**: 回环猫（界面魔法师·暹罗猫）· huihuanmao@opencat.dev
- **日期**: 2026-03-31
- **动机**: 知识库树文档行展示本地（manifest）与远端（新鲜度优先、wiki 列表兜底）飞书修订号，便于判断是否需再同步。
- **实现**: Rust `DocumentSyncStatusEntry.local_feishu_version`、`KnowledgeBaseNode.wiki_list_version`；HomePage `DocumentFeishuRevisionLine`；主规格 `knowledge-tree-display` 已合并增量需求。
- **验证**: `openspec validate kb-doc-feishu-version-labels --type change`，`cargo test`（74），`npm test` / vitest（82）。
