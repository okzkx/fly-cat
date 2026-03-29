## Why

When a sync task is created with folder-level or space-level selections, the individual documents under those selections never transition from "未同步" (not synced) to "同步中" (syncing) status. `getSyncingDocumentIds()` in `HomePage.tsx` only collects IDs from `task.selectedSources` entries that have a `documentId` field. Folder and space scopes do not carry `documentId`, so the set is always empty for non-leaf selections. The discovered document IDs are already computed during task creation but discarded after setting `counters.total`.

## What Changes

- Add a `discoveredDocumentIds: string[]` field to the `SyncTask` interface to persist the resolved document IDs at task creation time
- Populate `discoveredDocumentIds` in both `createSyncTask` (browser) and the Tauri backend task creation path
- Refactor `getSyncingDocumentIds()` to read from `task.discoveredDocumentIds` instead of scanning `selectedSources` for `documentId`

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `sync-focused-application-experience`: the `Sync Lifecycle Status Visibility` requirement implicitly expects document-level syncing status to be visible in the tree when a task is active — this fix makes that contract hold for folder/space selections

## Impact

- `src/types/app.ts` — `SyncTask` interface gains an optional `discoveredDocumentIds` field
- `src/utils/browserTaskManager.ts` — `createSyncTask` stores discovered document IDs in the task
- `src/components/HomePage.tsx` — `getSyncingDocumentIds` reads from `discoveredDocumentIds` instead of filtering `selectedSources`
- Tauri backend task creation (Rust) — should populate the same field when available; this change is scoped to the browser simulation path initially
