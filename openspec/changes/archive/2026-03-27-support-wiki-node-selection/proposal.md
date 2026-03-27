## Why

当前知识库树已经支持选择整库、目录和文档，但部分“库”节点会被后端按非目录叶子节点处理，前端因此无法像目录一样勾选它们作为同步根。用户在知识库中常用“库”组织一组相关文档，现有行为会迫使用户改为整库同步或逐篇勾选文档，导致同步范围过大或操作成本过高。

## What Changes

- 修正知识库节点分类，让表示文档集合的“库/容器”节点按目录来源处理，而不是降级为不可选叶子节点。
- 复用现有目录子树选择与同步规划语义，使“库”节点可以直接作为显式同步根参与去重、摘要展示和任务创建。
- 增加覆盖“库”节点选择与同步的前后端回归用例，避免再次把可同步容器误判为多维表格等不支持来源。

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `knowledge-base-source-sync`: 明确知识库中的“库/容器”节点属于可选目录来源，并要求同步规划与树节点分类对这类节点保持一致。

## Impact

- Tauri backend knowledge-base node classification and scoped discovery.
- Frontend tree selection, source normalization, and sync-summary rendering.
- Regression coverage for library/container node selection and queue building.
