## 1. Cleanup-only flow

- [ ] 1.1 Update `App.tsx` so cleanup-only runs return after deleting unchecked synced documents when no explicit sources are selected.
- [ ] 1.2 Preserve the existing status refresh and normal sync-task creation flow for non-cleanup runs.

## 2. Regression coverage

- [ ] 2.1 Add a focused test for the cleanup-only path to ensure it does not call `createSyncTask`.
- [ ] 2.2 Validate the OpenSpec change and mark the tasks complete after implementation.
