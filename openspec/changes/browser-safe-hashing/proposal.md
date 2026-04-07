## Why

The desktop app currently crashes in the frontend bundle because `src/services/path-mapper.ts` imports `node:crypto`, which Vite externalizes for browser compatibility. The path helper only needs a deterministic short suffix, so the current dependency is stronger than necessary and breaks the UI before the user can continue.

## What Changes

- Replace the browser-loaded path collision suffix helper with a deterministic browser-safe implementation that does not import `node:crypto`.
- Add regression coverage for the suffix helper so the replacement stays stable across future refactors.
- Keep the existing path mapping behavior unchanged aside from removing the incompatible runtime dependency.

## Capabilities

### New Capabilities
- `browser-compatible-client-utilities`: Browser-loaded frontend utility modules can provide deterministic path helper behavior without depending on Node-only crypto APIs.

### Modified Capabilities
- None.

## Impact

- Affected code: `src/services/path-mapper.ts`, `src/components/HomePage.tsx`, related tests
- Runtime impact: removes a frontend startup crash caused by browser-incompatible Node imports
- Validation impact: adds regression checks for deterministic suffix generation
