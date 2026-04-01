## Why

Freshness for synced documents is refreshed automatically after a 2s debounce when sync status changes, but users cannot trigger a full remote metadata refresh on demand. A single explicit control reduces uncertainty when comparing local trees to Feishu without starting a file sync.

## What Changes

- Add a **全部刷新** control on the knowledge base home card that runs the same batch freshness query as the existing debounced effect: `checkDocumentFreshness` for every document id whose sync status is `synced`, then `saveFreshnessMetadata` to persist results.
- No new Tauri commands; no change to per-row **重新同步** (file sync) behavior.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `knowledge-tree-display`: add a requirement for a bulk “refresh all remote freshness” control alongside existing per-row actions.

## Impact

- **Frontend**: `src/components/HomePage.tsx` (button, handler, loading state).
