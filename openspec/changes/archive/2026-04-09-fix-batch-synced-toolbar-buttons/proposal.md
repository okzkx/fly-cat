## Why

After users check multiple synced documents in the knowledge tree, **全部刷新** and **强制更新** sometimes stay disabled even though the UI shows a valid multi-document selection. Toolbar enablement must follow the same checked scope users rely on for **批量删除**.

## What Changes

- Derive the set of checked **synced** document ids for bulk toolbar actions by **unioning** tree-walk results with **explicit** `document` / `bitable` entries in `selectedSources`, applying the same synced and active-sync exclusions.
- Keep folder/space bulk scope behavior unchanged (still driven by loaded subtree keys).

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `knowledge-tree-display`: Clarify that bulk freshness/delete actions treat every checked synced leaf represented in `selectedSources` as in scope, not only ids reachable via `expandedCheckedKeys` + in-memory tree traversal.

## Impact

- `src/components/HomePage.tsx`: `checkedSyncedDocumentIds` and `checkedDocumentScopeMap` computation.
