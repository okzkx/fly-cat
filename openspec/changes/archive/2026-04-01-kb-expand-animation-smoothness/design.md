## Context

The home-page source tree uses Ant Design `Tree` with `loadData` and `setLoadedSpaceTrees` in the parent. When `listKnowledgeBaseNodes` resolves, an immediate `setState` can force a large reconciliation and layout in the same turn as rc-tree’s collapse/expand motion, which hurts perceived smoothness.

## Goals / Non-Goals

**Goals:**

- Improve frame pacing during expand/collapse when new children arrive from the network.
- Minimal code and zero user-visible behavior change beyond smoother motion.

**Non-Goals:**

- Virtualizing the entire tree or changing tree height/layout.
- Disabling motion or changing animation curves.
- Altering lazy-load triggers or API calls.

## Decision

Wrap `setLoadedSpaceTrees` updates that follow `listKnowledgeBaseNodes` in React `startTransition` so React treats the heavy tree refresh as lower priority than urgent UI (including transition paint).

Alternatives considered:

- `useDeferredValue(loadedSpaceTrees)` — delays visible data and changes when children appear; rejected as a behavior change.
- `motion={false}` on Tree — removes animation; rejected.
- Memoizing every tree title — helps unrelated re-renders but not the load-completion burst; may follow later if profiling warrants.

## Risks

- Children may appear one frame later than today; acceptable and usually imperceptible compared to network latency.
