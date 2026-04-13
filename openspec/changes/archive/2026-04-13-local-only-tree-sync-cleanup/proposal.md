## Why

Users can have successfully synced files on disk whose Feishu wiki nodes were later removed or moved. Today the knowledge tree only reflects the remote wiki listing, so these “local-only” leftovers disappear from the tree while still occupying manifest rows and disk space. Users cannot select them to clean up through the same sync flow they already understand.

## What Changes

- Merge manifest-backed document or bitable leaves into each loaded tree level when they have local output, match the current space and parent path, and are absent from the remote child list for that folder (including space root).
- Mark those synthetic nodes so the UI can treat them as selectable clean-up targets (not “blocked as already synced” in ways that prevent selection when appropriate).
- When the user includes such a node in the sync selection and runs a sync task, the backend removes local outputs and manifest rows for those documents instead of attempting a content re-fetch that cannot succeed.

## Capabilities

### New Capabilities

### Modified Capabilities

- `knowledge-tree-display`: Add requirements for rendering and selecting manifest-only leaves that are absent from the remote listing but still present locally.
- `tauri-desktop-runtime-and-backend`: Add requirements for discovery and sync orchestration that perform safe manifest-and-disk cleanup for remote-missing selections.

## Impact

- `src-tauri/src/commands.rs` (`list_space_source_tree`, document discovery, sync worker loop), `src-tauri/src/model.rs` (`SyncSourceDocument` / `KnowledgeBaseNode` fields as needed).
- `src/utils/runtimeClient.ts`, `src/App.tsx` (pass resolved sync root into tree listing when available).
- `src-tauri/src/local_agent.rs` and local-agent HTTP query for optional sync root on tree routes.
- Frontend types `src/types/sync.ts` for any new node flags consumed by tree selection helpers.
