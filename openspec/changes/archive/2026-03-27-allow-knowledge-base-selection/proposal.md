## Why

当前同步来源的多选能力只覆盖文档节点，知识库树中的“库/目录”节点仍然只能作为单一 `selectedScope` 使用，无法像文档一样加入显式来源集合。用户在知识库下按结构组织内容时，常常需要一次同步某个库下的整组文档或把若干库与文档组合起来；现有行为会迫使用户退回到整库同步或逐篇点选文档，范围过大或操作过碎。

## What Changes

- 将显式来源选择从“仅文档可多选”扩展为“同一知识库内的目录/库节点和文档节点都可选”，仍然排除多维表格等非文档叶子节点。
- 调整选择归一化和同步规划逻辑，让目录来源像文档子树一样参与去重、覆盖关系判断和有效同步文档队列生成。
- 更新同步创建与任务展示摘要，使其能准确表达“整库 / 目录子树 / 文档 / 混合多选”四类来源组合及对应文档数量。

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `knowledge-base-source-sync`: 扩展显式选中来源模型，使同一知识库内的目录/库节点也能作为同步根参与队列构建、去重和跨空间校验。
- `sync-focused-application-experience`: 更新知识库树交互和同步范围摘要，让目录/库节点具备与文档节点一致的可勾选体验，并在执行前后展示混合来源上下文。

## Impact

- Frontend tree checkbox behavior, selected-source normalization, and sync summary rendering.
- Browser/Tauri task contracts and selected-source persistence for mixed folder/document roots.
- Automated coverage for folder-inclusive selection, overlap normalization, and mixed-scope task summaries.
