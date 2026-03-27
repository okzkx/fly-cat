## Why

当前同步流程把知识库来源建模为单一 `scope`，用户一次只能同步整个知识库、一个目录，或一篇文档。参考项目已经支持在同一知识库内按文档多选后批量执行，因此现有行为会放大无关文档的同步范围，也无法满足按需组合选择多个离散文档的同步需求。

## What Changes

- 将知识库来源选择从“单一 scope”扩展为“同一知识库内可多选多个文档节点”，允许一次同步多个离散文档。
- 调整同步规划与任务入参，使其基于一组显式选中的来源节点构建去重后的文档队列，而不是只接受单个选中 scope。
- 更新同步创建与任务展示体验，在执行前后清晰展示多选来源、选中文档数量和最终生效的同步范围。

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `knowledge-base-source-sync`: 选中范围从单个知识库 scope 扩展为同一知识库内多个显式选中的文档来源，并要求同步规划对多选结果去重后建队。
- `sync-focused-application-experience`: 同步配置与任务展示改为反映多选文档来源，而不是仅展示单一知识库/目录/文档 scope。

## Impact

- Frontend source tree selection state, sync setup summary, and task/history presentation.
- Tauri command contracts, selected-source data model, and sync queue planning logic.
- Automated coverage for multi-select source state, queue deduplication, and displayed sync scope summaries.
