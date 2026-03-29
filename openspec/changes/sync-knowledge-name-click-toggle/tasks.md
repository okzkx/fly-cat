## 1. handleSelect Toggle Behavior

- [ ] 1.1 Change handleSelect to toggle checkbox state instead of always checking — read `allCheckedKeys.has(nodeKey)` and pass `!isChecked` (shouldBeChecked) to `onToggleSource`
- [ ] 1.2 Add uncheckedSyncedDocKeys sync in handleSelect — replicate the `syncedDocTreeKeys.has(nodeKey)` check and `setUncheckedSyncedDocKeys` update logic from onCheck into handleSelect
