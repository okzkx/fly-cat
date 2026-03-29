## 1. Tree utility

- [ ] 1.1 Add `collectDescendantDocumentIds(node)` helper that recursively extracts all `documentId` values from a `KnowledgeBaseNode` tree

## 2. NodeSyncStatusTag component

- [ ] 2.1 Create `NodeSyncStatusTag` component that dispatches by `nodeKind`: document → existing `DocumentSyncStatusTag`, folder/space → aggregated tag, bitable → "不支持" tag
- [ ] 2.2 Implement aggregated tag logic: given descendant document IDs and `documentSyncStatuses`, compute synced/total counts and display "N/M 已同步", "全部已同步", or "未同步"

## 3. Integration

- [ ] 3.1 Replace the `showSyncStatus` guard and `DocumentSyncStatusTag` usage in `titleRender` with `NodeSyncStatusTag` for all node types (except root "wiki-root" node)
