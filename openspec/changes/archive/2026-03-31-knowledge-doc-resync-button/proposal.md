## Why

Users need to refresh a single knowledge-base document without re-running a full multi-source sync from the main action. A per-row control makes “pull latest for this doc” obvious and fast.

## What Changes

- Add a small refresh-style control next to each document and bitable row in the knowledge tree (alongside existing actions such as “open in browser”).
- Wire the control to the existing sync pipeline: remove local manifest/files for that document when applicable, create a one-source sync task, start it, and refresh per-document sync status in the UI.

## Capabilities

### New Capabilities

_(none — behavior extends existing home tree and sync flows.)_

### Modified Capabilities

- `knowledge-tree-display`: Add a requirement that document and bitable rows expose an explicit “re-sync this item” control with defined enable/disable and action behavior.

## Impact

- Frontend: `HomePage.tsx`, `App.tsx`, types in `src/types/app.ts` for a new callback prop.
- Reuses: `createSyncTask`, `startSyncTask`, `removeSyncedDocuments`, `getDocumentSyncStatuses`, `normalizeSelectedSources` from existing modules.
