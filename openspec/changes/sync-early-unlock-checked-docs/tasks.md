## 1. Implementation

- [x] 1.1 扩展 `buildTreeNodes` / `buildTreeData`：增加 `syncedDocumentIds`，对 `document` / `bitable` 叶子节点在已同步时不禁用 checkbox。
- [x] 1.2 从 `HomePage` 传入已同步文档集合，确认 `useMemo` 依赖包含 `documentSyncStatuses`。
- [x] 1.3 运行 `npm test`（或项目既定前端测试）与 `npm run lint`，修复本变更引入的问题。

## 2. Validation

- [x] 2.1 `openspec validate --change sync-early-unlock-checked-docs` 通过。
