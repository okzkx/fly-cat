## Why

When a user selects a parent folder (or space) and clicks "start sync", all child documents remain displayed as "未同步" (not synced) until the entire sync run completes, after which they all change to "已同步" (synced) simultaneously. This gives no visual feedback during the sync process and makes the app feel unresponsive. The user expects child documents to immediately show "等待同步" (waiting) once discovery finishes, and then transition individually to "已同步" as each document completes.

## What Changes

- Add `discovered_document_ids` field to the Rust `SyncTask` struct so discovered document IDs are included in `sync-progress` events emitted to the frontend
- After document discovery in `spawn_sync_progress`, store the discovered document IDs on the task before emitting the first progress event
- Save the manifest to disk after every document sync (instead of every 10) so `get_document_sync_statuses` reflects per-document progress in real time
- Update `DocumentSyncStatusTag` to show "等待同步" for documents that are discovered but not yet synced, instead of the generic "同步中 X/Y" counter
- Update `AggregateSyncStatusTag` to distinguish "等待同步" state for parent nodes whose children are all discovered but none have synced yet

## Capabilities

### New Capabilities

_None_

### Modified Capabilities

- `knowledge-base-source-sync`: Add `discovered_document_ids` to `SyncTask`, save manifest per-document, and emit discovered IDs in progress events
- `knowledge-tree-display`: Update `DocumentSyncStatusTag` and `AggregateSyncStatusTag` to render "等待同步" state for discovered-but-unsynced documents

## Impact

- **Rust backend** (`src-tauri/src/commands.rs`): `SyncTask` struct gains a new field; `spawn_sync_progress` stores discovered IDs and saves manifest after every document
- **React frontend** (`src/components/HomePage.tsx`): Status tag components gain a new visual state
- **TypeScript types** (`src/types/app.ts`): `discoveredDocumentIds` already exists; no change needed
- **Backward compatibility**: `#[serde(default)]` on the new Rust field ensures existing saved tasks load without errors
