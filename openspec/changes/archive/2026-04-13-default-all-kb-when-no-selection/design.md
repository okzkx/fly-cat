## Approach

1. **任务来源（开始同步）**  
   在 `onCreateTask` 中：若 `selectedSources.length === 0` 且存在至少一个知识空间，则 `taskSources = normalizeSelectedSources(buildAllKnowledgeSpaceScopes(spaces))`；否则保持原有 `getEffectiveSelectedSources` / 显式 `options.selectedSources` 逻辑。  
   `buildAllKnowledgeSpaceScopes` 置于 `syncSelection.ts`，与现有 `scopeKey` / `dedupeSelectedSources` 同层，避免与 `HomePage` 内联 `buildSpaceScope` 重复导出过多。

2. **全部刷新**  
   在 `HomePage` 内用 `useMemo` 计算 `refreshFreshnessDocumentIds`：若 `checkedSyncedDocumentIds.length > 0` 则用勾选集合；否则用 `documentSyncStatuses` 中 `status === "synced"` 且不在当前任务 `syncingIds` 中的全部文档 id。  
   仅「刷新」分支使用该集合；「强制更新」仍只读 `checkedSyncedDocumentIds`。

3. **按钮与提示**  
   - 「开始同步」：仅当 `spaces.length === 0` 时禁用；工具提示说明未勾选时默认整库。  
   - 「全部刷新」：当 `refreshFreshnessDocumentIds.length === 0` 时禁用。  
   - `handleStartSync` 失败提示区分「无知识空间」与「仍无法创建任务」。

## Risks

- 多知识库整库同步任务体量较大，与显式全选行为一致，需在规格中写明为预期行为。
