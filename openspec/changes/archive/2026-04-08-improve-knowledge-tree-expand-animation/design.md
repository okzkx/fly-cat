## Context

The diagnosis plan points to two low-risk hotspots in the knowledge tree:

1. Tree row rendering is heavy because `titleRender` in `HomePage` builds a wrapped row containing revision text, sync tags, freshness indicators, tooltips, and multiple action buttons for every visible node.
2. The tree is currently unbounded, so large expanded subtrees can create a large DOM surface instead of using the Tree component's virtualized viewport behavior.

The task goal is to improve expand/collapse smoothness with the smallest safe optimization set, without changing sync semantics, checkbox rules, preview behavior, or lazy-loading behavior.

## Goals / Non-Goals

**Goals:**
- Reduce render and layout work during expand/collapse for already-loaded nodes.
- Reduce the number of simultaneously rendered nodes in large trees.
- Remove obvious repeated per-node work that scales with row count.
- Preserve current sync, selection, preview, and per-row action behavior.

**Non-Goals:**
- Rebuild tree-data generation around new indexes or caches.
- Change lazy-loading request timing or introduce staged subtree insertion.
- Redesign the knowledge tree card or remove existing metadata/actions from rows.

## Decisions

1. Use a bounded tree viewport and Tree `height`.
   - This enables the Ant Design Tree virtualization path with a small UI change that is acceptable for a desktop side-by-side layout.
   - Alternative considered: only tweaking animation/CSS. Rejected because it would not reduce DOM or commit cost.

2. Extract tree row rendering into memo-friendly components and replace wrapped `Space` layout with stable flex rows.
   - This reduces re-created inline JSX and avoids wrap-driven layout churn when rows mount in batches.
   - Alternative considered: keep inline `titleRender` and only memoize helper functions. Rejected because layout cost would remain high.

3. Precompute shared booleans/sets once per render instead of once per node.
   - Specifically, compute whether sync statuses exist and build the discovered-document-id set once before scanning loaded trees.
   - Alternative considered: deeper tree traversal caching. Rejected for this change because it increases scope and regression risk.

## Risks / Trade-offs

- [Fixed tree viewport changes card proportions] -> Use a conservative height that still fits the existing desktop layout.
- [Single-line row layout may truncate long labels] -> Prefer truncation for secondary text/actions while keeping the main title readable.
- [Memoization may not help if props churn too much] -> Keep props primitive where practical and avoid passing unnecessary large objects into helper components.
