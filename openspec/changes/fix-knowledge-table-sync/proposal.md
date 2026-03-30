## Why

Knowledge-base tables are still treated as unsupported in the current source tree, even though the backend sync pipeline already knows how to export `sheet` and `bitable` items as `.xlsx`. Users cannot select a table node directly, table descendants are skipped during discovery, and repeated runs cannot safely recognize an unchanged exported table file.

## What Changes

- Allow knowledge-tree `bitable` leaf nodes to participate in sync source selection and discovery instead of labeling them as unsupported.
- Include descendant tables when a user syncs an enclosing space, folder, or subtree-capable document, and preserve their `.xlsx` output path for incremental checks.
- Replace the bitable "不支持" status treatment with normal sync status rendering and add focused frontend/backend regression coverage.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `knowledge-base-source-sync`: Knowledge-base sync source selection and discovery must include syncable table leaves, both as explicit roots and as descendants of selected parents.
- `knowledge-tree-display`: Bitable nodes in the knowledge tree must show real sync state instead of a permanent unsupported tag.
- `sync-focused-application-experience`: The source-selection tree must let users select syncable table leaves with the same immediate checkbox feedback as other leaf sources.

## Impact

- Frontend source-tree typing and selection helpers in `src/types/sync.ts`, `src/utils/treeSelection.ts`, and `src/components/HomePage.tsx`
- Browser-mode task/test helpers in `src/utils/browserTaskManager.ts`
- Backend discovery and incremental planning in `src-tauri/src/commands.rs` and `src-tauri/src/mcp.rs`
- Targeted regression tests in `tests/*.test.ts` and `src-tauri` unit tests
