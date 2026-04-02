## Context

The tree UI already has the right fallback behavior for documents that have no sync-status entry: leaf nodes show `未同步`, aggregate nodes stop counting that document as synced, and freshness indicators only appear for still-synced documents. The bug is therefore in the backend status source: `get_document_sync_statuses` currently maps every manifest `success` row to `synced` even if the recorded `output_path` has already been removed from disk by **强制更新** or another local cleanup path.

## Goals / Non-Goals

**Goals:**

- Make knowledge-tree sync badges reflect the real on-disk state, not only stale manifest rows.
- Ensure the fix covers the transient gap between local cleanup and the next successful sync write.
- Keep the implementation minimal by reusing the existing frontend fallback for missing sync-status entries.

**Non-Goals:**

- Introducing a new frontend sync-status enum such as `unsynced`.
- Changing freshness metadata storage or the forced version-alignment flow.
- Reworking manifest persistence semantics for successful or failed rows.

## Decisions

1. **Treat missing output files as not currently synced**
   Filter manifest `success` rows in `get_document_sync_statuses` by checking whether `output_path` still points to a file on disk. If the file is missing, omit that document from the returned status map so the UI naturally renders `未同步`.

2. **Keep failed rows visible**
   Preserve the current behavior for non-success rows. A failed sync attempt is still useful user-facing state even if no output file exists, so only stale `success` rows should be suppressed.

3. **Cover the regression with backend-focused tests**
   Add a focused Rust test around `get_document_sync_statuses` covering both branches: an existing output remains `synced`, while a deleted output disappears from the status map.

## Risks / Trade-offs

- **Manifest row remains while UI shows unsynced** -> This is intentional: the manifest still carries metadata for re-pull flows, but synced badges now represent current local availability rather than historical success.
- **Output-path validation uses `is_file()`** -> This matches current sync outputs, which are files for both Markdown and export documents; if output semantics change later, the helper may need revisiting.
