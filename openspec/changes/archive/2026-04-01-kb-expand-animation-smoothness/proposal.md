## Why

Expanding and collapsing the knowledge source tree (root “知识库” and nested spaces) can feel janky because lazy-loaded child data triggers a large synchronous React update while the tree’s height-collapse animation is still running, competing with layout and paint.

## What Changes

- Defer applying loaded subtree data to React state using a non-blocking transition so expand/collapse animations can complete frames smoothly.
- Keep existing lazy-load semantics, selection, checkbox behavior, and one-level expansion rules unchanged.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `sync-focused-application-experience`: add a testable expectation that expand/collapse of the source tree remains visually smooth when async child loads complete, without changing expansion or selection semantics.

## Impact

- Frontend: `App.tsx` (`onLoadTreeChildren` state updates); optional small follow-up in `HomePage.tsx` only if needed for stability.
