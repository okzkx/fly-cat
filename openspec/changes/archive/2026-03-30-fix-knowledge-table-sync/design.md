## Context

The current implementation has a split-brain behavior for knowledge-base tables. The backend export path already maps `sheet` and `bitable` objects to `.xlsx`, but the source-selection tree still treats `bitable` nodes as unsupported leafs: they cannot become `SyncScope`s, discovery skips them when walking selected roots, and the UI always renders "不支持" for their sync tag.

That mismatch makes the TODO a real product bug, not only a stale queue entry. Even if a future code path discovered a table, incremental planning would still compare it against the Markdown output-path helper and fail to recognize the exported `.xlsx` path as unchanged state.

## Goals / Non-Goals

**Goals:**
- Let a knowledge-base table leaf be selected and synchronized like any other leaf sync source.
- Ensure parent-root discovery includes descendant tables and feeds enough metadata into the sync queue for incremental planning.
- Show meaningful sync state for bitable nodes instead of a permanent unsupported tag.
- Add focused regression coverage for both frontend selection behavior and backend discovery/output-path handling.

**Non-Goals:**
- Introduce table-specific preview/rendering inside the app.
- Change the existing export-task vs raw-content fallback strategy for non-table documents.
- Redesign the overall knowledge-tree layout or selection-summary copy beyond what is required for table support.

## Decisions

Treat `bitable` as a syncable leaf `SyncScope`.
Rationale: the tree data model already carries a stable `documentId` for table leaves, and the backend pipeline already accepts their `obj_type` for export. Promoting bitable leaves into normal sync scopes removes the current frontend/backend mismatch with minimal surface-area change.

Keep descendant coverage rules on parent roots, not on bitable leaves.
Rationale: tables remain non-expandable leaves, so they should never cover descendants themselves. Space, folder, and subtree-capable document roots should continue to provide the only recursive selection behavior.

Capture table metadata from wiki-node discovery and reuse export-aware path calculation for unchanged checks.
Rationale: `bitable` items cannot rely on the docx-only summary endpoint, but the wiki node listing already identifies them. Extending the node model with version/update metadata and centralizing expected output-path logic lets incremental sync treat `.xlsx` files as first-class outputs.

Render bitable sync state through the same per-document status component used by document leaves.
Rationale: once bitables are in the discovered/synced set, the UI should not maintain a special "unsupported" branch. Reusing the existing status tag keeps the presentation consistent and reduces future drift.

## Risks / Trade-offs

- [OpenAPI wiki-node responses may omit version fields for some table items] -> Parse optional version/update fields with defensive fallbacks so discovery can still queue the table safely.
- [Selection-summary labels still use "documentCount" terminology for mixed document/table roots] -> Preserve the existing field contract for now and treat it as a count of syncable leaf outputs to avoid a broader API migration.
- [Parent subtree normalization could accidentally keep redundant bitable children enabled] -> Update both frontend and backend descendant-coverage helpers and back them with targeted tests.
