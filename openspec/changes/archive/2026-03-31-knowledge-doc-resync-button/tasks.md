## 1. Types and app wiring

- [x] 1.1 Extend `HomePageProps` in `src/types/app.ts` with `onResyncDocumentScope: (scope: SyncScope) => Promise<void>` (or equivalent name).
- [x] 1.2 In `App.tsx`, implement the handler: guard sync root and selection path, optionally `removeSyncedDocuments` when `documentId` present, `normalizeSelectedSources([scope])`, `createSyncTask`, `startSyncTask`, refresh tasks list and `documentSyncStatuses`.

## 2. Knowledge tree UI

- [x] 2.1 In `HomePage.tsx`, render a text `Button` with `ReloadOutlined` next to the export control for `document` and `bitable` rows only.
- [x] 2.2 Disable when `!syncRoot`, connection unusable, row has no `scopeValue`, or document id is in `syncingIds`; call `onResyncDocumentScope` with `treeNode.scopeValue` on click (stop propagation).
- [x] 2.3 Show brief feedback via `App.useApp().message` on success or failure.

## 3. Validation

- [x] 3.1 Run `pnpm exec eslint` (or project lint) on touched files and `pnpm run build` if available.
