## Context

The home knowledge tree already shows per-node sync tags and an “open in browser” control on document and bitable rows. Bulk sync is driven from `App.tsx` via `createSyncTask` + `startSyncTask`, with optional `removeSyncedDocuments` before a new task when users uncheck synced items.

## Goals / Non-Goals

**Goals:**

- Offer a dedicated control on each document and bitable row to re-sync only that row’s `SyncScope`.
- Before starting the task, remove any existing synced artifact for that document when a stable `documentId` is present (same semantics as refreshing local content).
- Keep the implementation in the frontend using existing Tauri/browser bridges; no new Rust commands.

**Non-Goals:**

- Queuing multiple concurrent sync engines or changing backend concurrency policy.
- Re-sync for folder or space rows (only leaf types that already support “open in browser”).

## Decisions

- **Placement**: Text icon button next to the existing export control, using Ant Design `ReloadOutlined` (refresh metaphor), with tooltip “重新同步”.
- **Scope payload**: Use `normalizeSelectedSources([scopeFromTreeNode])` so behavior matches checkbox selection rules (including `includesDescendants` documents).
- **Cleanup**: If `scope.documentId` is defined, call `removeSyncedDocuments(syncRoot, [documentId])` before `createSyncTask`; then refresh `getDocumentSyncStatuses`. If `documentId` is missing, skip removal and still attempt task creation (conservative fallback).
- **Busy state**: Disable the button while that document id is in the active task’s syncing set (`getSyncingDocumentIds`), or while a one-shot `resyncing` local flag is true for that row, to avoid double clicks.
- **Sync root missing**: Disable the button when `syncRoot` is empty or connection is not usable (mirror other sync actions).

## Risks / Trade-offs

- **Concurrent tasks** → If the runtime rejects starting a second task, user sees failure from existing error handling; mitigated by disabling when this doc is already syncing.
- **Bitable without documentId** → Removal skipped; sync task may still run from scope alone.

## Migration Plan

N/A (client-only UI and wiring).

## Open Questions

None for minimal scope.
