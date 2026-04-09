## 1. Implementation

- [ ] 1.1 Merge explicit `document` / `bitable` `documentId`s from `selectedSources` into `checkedSyncedDocumentIds` (dedupe, same synced + syncing filters).
- [ ] 1.2 Supplement `checkedDocumentScopeMap` from `selectedSources` when a merged id has no tree-derived scope yet.

## 2. Validation

- [ ] 2.1 `openspec validate fix-batch-synced-toolbar-buttons`
- [ ] 2.2 `pnpm test` (or project default) passes.
