## Context

`checkedSyncedDocumentIds` is built from `collectDocumentIdsByTreeKeys(loadedSpaceTrees, expandedCheckedKeys)` intersected with manifest-backed synced ids. That assumes every checked leaf’s `node.key` is present in `expandedCheckedKeys` and that the node exists in the currently loaded `KnowledgeBaseNode` tree. In practice, multi-document checkbox selection persists as multiple `SyncScope` rows in `selectedSources`; if tree/key alignment is incomplete, the collected id list can be empty while the UI still shows checked synced leaves.

## Goals / Non-Goals

**Goals:**

- Enable **全部刷新** / **强制更新** / **批量删除** whenever the user has at least one checked **document** or **bitable** leaf with status `synced` in `selectedSources`, subject to existing `canRunSync` and active-task gating.
- Preserve existing folder/space checked semantics (subtree collection from loaded nodes).

**Non-Goals:**

- Loading unloaded descendants for unchecked folder subtrees.
- Changing tooltip copy or button labels (handled elsewhere).

## Decisions

1. **Union explicit leaf sources with tree-derived ids**  
   After computing the tree-based id list, merge in `documentId` values from `selectedSources` where `kind` is `document` or `bitable`, the id is in `syncedDocumentIds`, and the id is not in `syncingIds`. Deduplicate with a `Set`.

2. **Scope map for refresh**  
   Extend `checkedDocumentScopeMap` so each merged document id has a `SyncScope` (prefer tree-derived scope when present; otherwise use the matching `selectedSources` entry with `includesDescendants: false`).

## Risks / Trade-offs

- Slightly broader merge path: if stale `selectedSources` contained a synced doc not visually checked, it would be included. `selectedSources` is the checkbox source of truth; risk is low and matches **开始同步** inputs.

## Migration

None.

## Open Questions

None.
