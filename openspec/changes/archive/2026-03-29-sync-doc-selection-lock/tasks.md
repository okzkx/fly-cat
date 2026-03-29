# Tasks

## Task 1: Add syncingKeys parameter to buildTreeNodes and buildTreeData

- [x] Modify `buildTreeNodes` in `src/components/HomePage.tsx` to accept a `syncingKeys: Set<string>` parameter
- [x] Add `isSyncing = scopeValue ? syncingKeys.has(scopeKey(scopeValue)) : false` condition
- [x] Update `disableCheckbox` to include `|| isSyncing`
- [x] Modify `buildTreeData` to accept and pass `syncingKeys` through to `buildTreeNodes`

## Task 2: Compute syncingKeys from activeSyncTask and selectedSources

- [x] In the `HomePage` component, compute `syncingKeys` as a `Set<string>` from `checkedSourceKeys` when `activeSyncTask` is not null
- [x] Pass `syncingKeys` to `buildTreeData` call
