# Tasks

## Task 1: Add syncingKeys parameter to buildTreeNodes and buildTreeData

- [ ] Modify `buildTreeNodes` in `src/components/HomePage.tsx` to accept a `syncingKeys: Set<string>` parameter
- [ ] Add `isSyncing = scopeValue ? syncingKeys.has(scopeKey(scopeValue)) : false` condition
- [ ] Update `disableCheckbox` to include `|| isSyncing`
- [ ] Modify `buildTreeData` to accept and pass `syncingKeys` through to `buildTreeNodes`

## Task 2: Compute syncingKeys from activeSyncTask and selectedSources

- [ ] In the `HomePage` component, compute `syncingKeys` as a `Set<string>` from `checkedSourceKeys` when `activeSyncTask` is not null
- [ ] Pass `syncingKeys` to `buildTreeData` call
