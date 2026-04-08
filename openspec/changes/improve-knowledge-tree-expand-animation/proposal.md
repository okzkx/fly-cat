## Why

Knowledge-tree expand and collapse interactions feel janky once a subtree is already loaded, and first-time lazy expansion still stalls when many child rows mount at once. The current tree rows pack revision text, status tags, freshness icons, and per-row actions into a wrapped inline layout, so each expand/collapse pays too much render and layout cost.

## What Changes

- Bound the knowledge tree to a fixed internal scroll viewport so large expanded trees do not keep growing the card and can use the Tree component's virtualized rendering path.
- Refactor tree row rendering into lighter memo-friendly subcomponents with a stable single-line layout instead of wrapped `Space` content.
- Remove repeated per-node work during tree rendering where the same sync-status presence and discovered-id sets are recomputed for many rows.
- Keep selection, preview, sync status, and row action behavior unchanged while improving expand/collapse smoothness.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `knowledge-tree-display`: add bounded tree viewport and stable inline row layout requirements for large expand/collapse interactions.

## Impact

- Affected code: `src/components/HomePage.tsx`, `src/styles.css`
- Affected UX: knowledge tree rendering, scrolling, and row layout during expand/collapse
- No backend/API changes
