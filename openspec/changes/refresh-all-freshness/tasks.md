## 1. Implementation

- [x] 1.1 Add `syncedIdsForFreshness` (or equivalent) derived from `documentSyncStatuses` matching the debounced effect’s id list.
- [x] 1.2 Add `refreshingAllFreshness` state and `handleRefreshAllFreshness` calling `checkDocumentFreshness`, `setFreshnessMap`, `saveFreshnessMetadata`, with success/error messaging.
- [x] 1.3 Add **全部刷新** button in the home `Card` `extra` toolbar with `disabled`/`loading` per design; optional `data-testid` for tests.

## 2. Validation

- [x] 2.1 `openspec validate --change refresh-all-freshness`
- [x] 2.2 `npm run typecheck`
- [x] 2.3 `npm test`
