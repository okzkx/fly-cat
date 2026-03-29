## 1. Rust Backend - SyncTask Struct

- [x] 1.1 Add `discovered_document_ids: Vec<String>` field with `#[serde(default)]` to `SyncTask` struct in `commands.rs`

## 2. Rust Backend - Document Discovery

- [x] 2.1 After document discovery completes in `spawn_sync_progress`, collect all document IDs (both queued and skipped) and store them in `task.discovered_document_ids` before emitting the first `sync-progress` event

## 3. Rust Backend - Manifest Persistence

- [x] 3.1 Change manifest save condition in `spawn_sync_progress` from batch (every 10 documents) to after every document: save manifest to disk immediately after `upsert_manifest_record`, before emitting the `sync-progress` event

## 4. Frontend - Document Status Tag

- [x] 4.1 Update `DocumentSyncStatusTag` in `HomePage.tsx`: when a document is in `syncingIds` but has no manifest status entry, display "等待同步" tag (default/neutral color) instead of "同步中 X/Y"

## 5. Frontend - Aggregate Status Tag

- [x] 5.1 Verify `AggregateSyncStatusTag` shows correct "同步中 X/Y" progress when some children are discovered and syncing, using the existing `syncing` flag and counter logic (should already work once `discoveredDocumentIds` is populated on the backend)
