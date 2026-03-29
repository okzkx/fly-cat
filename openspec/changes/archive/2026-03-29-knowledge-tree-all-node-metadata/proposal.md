## Why

Currently, sync metadata (status tags) is only displayed on document nodes in the knowledge tree. Users cannot see the sync status of folders, spaces, or knowledge bases at a glance, making it hard to assess overall sync progress without expanding every node.

## What Changes

- Add sync metadata display to all tree node types: space, folder, document, and bitable
- For parent nodes (space, folder), aggregate child document statuses into a summary tag (e.g. "3/10 已同步")
- For bitable nodes, display a "不支持同步" tag since they cannot be synced
- For document nodes, keep the existing per-document status tag behavior unchanged

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `knowledge-tree-display`: Add requirement for metadata tags on all tree node types

## Impact

- `src/components/HomePage.tsx` — `titleRender` logic and new `NodeSyncStatusTag` component
- `src/types/sync.ts` — no type changes needed
- Existing `knowledge-tree-display` spec will be updated with metadata display requirements
