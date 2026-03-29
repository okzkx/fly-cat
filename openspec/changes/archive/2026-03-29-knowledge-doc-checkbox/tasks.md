## 1. Frontend State Management

- [x] 1.1 Add `uncheckedSyncedDocKeys` state (Set<string>) to track user-initiated unchecks of synced documents in `HomePage.tsx`
- [x] 1.2 Update `allCheckedKeys` computation to merge `checkedSourceKeys` with `syncedDocTreeKeys` minus `uncheckedSyncedDocKeys`
- [x] 1.3 Update `onCheck` handler to toggle keys in `uncheckedSyncedDocKeys` when the changed node is a synced document being unchecked/checked

## 2. Sync Start Cleanup Flow

- [x] 2.1 Compute `documentsToDelete` in `HomePage.tsx`: the set of synced document IDs whose tree keys are in `uncheckedSyncedDocKeys` (i.e., synced but unchecked)
- [x] 2.2 Export `uncheckedSyncedDocKeys` or `documentsToDelete` via a new prop or callback so `App.tsx` can access it before creating a sync task
- [x] 2.3 In `App.tsx` `onCreateTask`, call `removeSyncedDocuments` with the unchecked synced document IDs before calling `createSyncTask`
- [x] 2.4 After cleanup, refresh `documentSyncStatuses` via `getDocumentSyncStatuses` to reflect the deletion

## 3. Syncing Checkbox Disable (Verify Existing)

- [x] 3.1 Verify that the existing `syncingKeys` + `disableCheckbox` logic in `buildTreeNodes` correctly prevents checking/unchecking of syncing and pending documents
- [x] 3.2 Ensure that `uncheckedSyncedDocKeys` does not interfere with disabled checkboxes (syncing docs cannot be added to unchecked set)

## 4. Edge Cases and Polish

- [x] 4.1 Reset `uncheckedSyncedDocKeys` when `documentSyncStatuses` changes (e.g., after a sync completes) so previously deleted docs are not re-tracked
- [x] 4.2 Ensure folder-level and space-level unchecking correctly identifies all descendant synced document IDs for deletion
