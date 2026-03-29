## 1. Utility Functions

- [ ] 1.1 Add `collectAllDescendantKeys(treeData, nodeKey)` function to `treeSelection.ts` that walks the tree data and returns all descendant keys of a given node
- [ ] 1.2 Add `computeTriState(currentCheckedKeys, nodeKey, allDescendantKeys)` function to `treeSelection.ts` that determines the current aggregate state: 'all-checked', 'none-checked', or 'mixed'
- [ ] 1.3 Add `computeCascadedCheckedKeys(currentCheckedKeys, nodeKey, allDescendantKeys, currentState)` function to `treeSelection.ts` that returns the new set of checked keys after the tri-state toggle

## 2. HomePage Tree Checkbox Integration

- [ ] 2.1 Replace the current `onCheck` handler with tri-state cycling logic that uses `computeTriState` and `computeCascadedCheckedKeys`
- [ ] 2.2 Update `onSelect` handler (`handleSelect`) to use the same tri-state cycling logic for name-click toggling
- [ ] 2.3 Update `syncedDocTreeKeys` / `uncheckedSyncedDocKeys` tracking to cascade correctly (add to unchecked set on cascading uncheck, remove on cascading check)
- [ ] 2.4 Fix `checkedKeys` prop to pass only truly checked keys (remove explicit `halfChecked: []` so Ant Design computes indeterminate state automatically)

## 3. Testing

- [ ] 3.1 Add tests for `collectAllDescendantKeys`, `computeTriState`, and `computeCascadedCheckedKeys` utility functions
- [ ] 3.2 Verify that existing knowledge-base-tree-loading tests still pass
