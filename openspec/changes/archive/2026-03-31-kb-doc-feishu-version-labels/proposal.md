## Why

Users need to compare the Feishu revision they last synced locally with the current remote revision to decide whether to re-sync. Today the tree shows sync status and a small freshness icon, but not an explicit local/remote version pair on each document row.

## What Changes

- Expose manifest `version` as **local Feishu revision** in `get_document_sync_statuses` for each document record.
- Include **wiki list API revision** on each `KnowledgeBaseNode` so unsynced documents can show a remote listing value before freshness runs.
- On knowledge tree **document** (and bitable) rows, render compact secondary text: local revision / remote revision, using freshness metadata when available and wiki list value as fallback for remote.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `knowledge-tree-display`: Document and bitable nodes SHALL show explicit local/remote Feishu revision labels when a sync root is configured (Tauri); browser fixture mode MAY omit version text.

## Impact

- `src-tauri/src/model.rs` — extend `DocumentSyncStatusEntry`
- `src-tauri/src/commands.rs` — `get_document_sync_statuses`, `KnowledgeBaseNode`, `build_tree_nodes_from_openapi`, `clone_collapsed_nodes`, fixtures
- `src/types/sync.ts`, `src/utils/tauriRuntime.ts` — TypeScript types and invoke typing
- `src/components/HomePage.tsx` — tree `titleRender` version line for document/bitable leaves
