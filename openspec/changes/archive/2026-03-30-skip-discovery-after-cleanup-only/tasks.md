## 1. Cleanup-only flow

- [x] 1.1 Update `App.tsx` so cleanup-only runs return after deleting unchecked synced documents when no explicit sources are selected.
- [x] 1.2 Preserve the existing status refresh and normal sync-task creation flow for non-cleanup runs.

## 2. Regression coverage

- [x] 2.1 Add a focused test for the cleanup-only path to ensure it does not call `createSyncTask`.
- [x] 2.2 Validate the OpenSpec change and mark the tasks complete after implementation.
