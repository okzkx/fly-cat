## Context

The sync pipeline (`spawn_sync_progress` in `commands.rs`) discovers all documents, then syncs them one by one. After each document, it emits a `sync-progress` event and periodically saves the manifest to disk (every 10 documents). The frontend listens for `sync-progress` events and refreshes both the task list and per-document sync statuses.

The root cause is two-fold:
1. The Rust `SyncTask` struct has no `discovered_document_ids` field, so when progress events reach the frontend, `getSyncingDocumentIds()` cannot identify discovered-but-unsynced documents for folder/space selections.
2. The manifest is only persisted every 10 documents, so `get_document_sync_statuses` returns stale data until the next batch save.

## Goals / Non-Goals

**Goals:**
- All child documents show "等待同步" immediately after discovery completes
- Each document transitions individually to "已同步" as it completes syncing
- Parent (folder/space) aggregate tags reflect real-time progress

**Non-Goals:**
- Changing the sync execution model (remains sequential, one document at a time)
- Adding a per-document "currently syncing" state (would require the backend to emit a separate "start syncing doc X" event; the overhead is not justified for the current sequential model)

## Decisions

**1. Add `discovered_document_ids` to Rust `SyncTask`**

Rationale: The TypeScript `SyncTask` already has this field. Adding it to the Rust struct closes the data gap so the backend can populate it and the frontend can consume it via existing `getSyncingDocumentIds()` logic. Using `#[serde(default)]` preserves backward compatibility with saved tasks.

Alternative considered: Emit a separate event type just for discovery completion. Rejected because it would add a new event type and listener for information that fits naturally into the existing `sync-progress` event payload.

**2. Save manifest to disk after every document**

Rationale: The `get_document_sync_statuses` Tauri command reads from disk. Saving after each document ensures the frontend sees per-document status updates on the next `sync-progress` event. The manifest is a small JSON file; the I/O overhead is negligible compared to network fetch time per document.

Alternative considered: Keep in-memory manifest and add a Tauri command to query it. Rejected because it would require sharing mutable state across threads and adding a new command; file-based persistence is simpler and already proven.

**3. Show "等待同步" as a new tag style in `DocumentSyncStatusTag`**

Rationale: Distinguishes "discovered but not yet synced" from "not part of any sync" (未同步). Uses a default/neutral tag color to visually indicate pending state without confusion with active syncing or completion.

## Risks / Trade-offs

- **[Manifest I/O frequency]** Saving after every document increases disk writes → Mitigation: manifest is small JSON (~KB), writes are fast and sequential. No measurable performance impact expected.
- **[Backward compatibility]** New field on Rust `SyncTask` → Mitigation: `#[serde(default)]` ensures existing saved tasks deserialize without errors.
