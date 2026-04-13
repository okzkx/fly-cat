## 1. Implementation

- [ ] 1.1 在 `syncSelection.ts` 增加 `buildAllKnowledgeSpaceScopes`，供无勾选时整库任务来源使用
- [ ] 1.2 更新 `App.tsx` 的 `onCreateTask`：`selectedSources` 为空时用上述 scopes + `normalizeSelectedSources`
- [ ] 1.3 更新 `HomePage.tsx`：计算 `refreshFreshnessDocumentIds`；「全部刷新」与 `handleBulkFreshnessAction("refresh")` 使用该集合；「开始同步」禁用条件与 tooltip；区分强制更新仍依赖勾选

## 2. Validation

- [ ] 2.1 `openspec validate --change "default-all-kb-when-no-selection"`
- [ ] 2.2 `npm run build`（或项目等价命令）通过
