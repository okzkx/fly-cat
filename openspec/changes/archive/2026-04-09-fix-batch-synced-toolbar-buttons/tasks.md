## 1. Implementation

- [x] 1.1 Merge explicit `document` / `bitable` `documentId`s from `selectedSources` into `checkedSyncedDocumentIds` (dedupe, same synced + syncing filters).
- [x] 1.2 Supplement `checkedDocumentScopeMap` from `selectedSources` when a merged id has no tree-derived scope yet.

## 2. Validation

- [x] 2.1 `openspec validate fix-batch-synced-toolbar-buttons`
- [x] 2.2 `pnpm test` (or project default) passes.
