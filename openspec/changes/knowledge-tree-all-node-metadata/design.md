## Context

The knowledge tree in `HomePage.tsx` currently displays sync status tags only on document nodes via `DocumentSyncStatusTag`. The status data (`documentSyncStatuses`) is a flat map keyed by document ID, provided from the Rust backend.

Tree nodes include: space (root), folder, document, bitable. Only document nodes have a `documentId`. Parent nodes (space, folder) contain descendants but do not have their own sync records.

## Goals / Non-Goals

**Goals:**
- Show aggregated sync summary on space and folder nodes
- Show "不支持" tag on bitable nodes
- Keep existing per-document tag behavior unchanged

**Non-Goals:**
- Changing the backend API or sync status data structure
- Clicking metadata tags to drill down into child status
- Showing sync status before `syncRoot` is configured

## Decisions

**D1: Aggregate child statuses in the frontend**
- The `documentSyncStatuses` map already contains all document-level statuses. For parent nodes, we walk the tree's descendant document IDs and compute an aggregate from this map.
- **Alternative**: Add a backend endpoint for per-node aggregate status. Rejected because it adds backend complexity for a pure display concern.

**D2: Compute document IDs from tree node children**
- For folder and space nodes, collect all descendant document IDs from the loaded tree data (`loadedSpaceTrees`), then look them up in `documentSyncStatuses`.
- The tree is already loaded and available; we just need a recursive helper to extract document IDs.

**D3: New component `NodeSyncStatusTag` replaces per-node-type logic**
- A single component handles all node types, dispatching internally to the right display based on `nodeKind`.
- Document path: delegate to existing `DocumentSyncStatusTag`.
- Folder/space path: aggregate child statuses.
- Bitable path: static "不支持" tag.

## Risks / Trade-offs

- [Tree traversal cost] → Tree data is already loaded in memory and typically small (<1000 nodes per space). A simple recursive walk is negligible.
- [Stale aggregate during active sync] → The same refresh mechanism (event listeners on progress/completed/failed) that updates `documentSyncStatuses` will automatically refresh aggregates on re-render.
