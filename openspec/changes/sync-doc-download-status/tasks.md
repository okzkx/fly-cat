## 1. Type Definition

- [ ] 1.1 Add optional `discoveredDocumentIds?: string[]` field to `SyncTask` interface in `src/types/app.ts`

## 2. Browser Task Manager

- [ ] 2.1 In `createSyncTask` in `src/utils/browserTaskManager.ts`, populate `discoveredDocumentIds` from the already-computed `discoveredDocuments` array

## 3. HomePage Status Display

- [ ] 3.1 Refactor `getSyncingDocumentIds()` in `src/components/HomePage.tsx` to use `task.discoveredDocumentIds` instead of scanning `selectedSources` for `documentId`
