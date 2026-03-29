## 1. Utility Functions

- [x] 1.1 Add `collectAllDescendantKeys(treeData, nodeKey)` function to `treeSelection.ts` that walks the tree data and returns all descendant keys of a given node
- [x] 1.2 Add `computeTriState(currentCheckedKeys, nodeKey, allDescendantKeys)` function to `treeSelection.ts` that determines the current aggregate state: 'all-checked', 'none-checked', or 'mixed'
- [x] 1.3 Add `computeCascadedCheckedKeys(currentCheckedKeys, nodeKey, allDescendantKeys, currentState)` function to `treeSelection.ts` that returns the new set of checked keys after the tri-state toggle

## 2. HomePage Tree Checkbox Integration

- [x] 2.1 Replace the current `onCheck` handler with tri-state cycling logic that uses `computeTriState` and `computeCascadedCheckedKeys`
- [x] 2.2 Update `onSelect` handler (`handleSelect`) to use the same tri-state cycling logic for name-click toggling
- [x] 2.3 Update `syncedDocTreeKeys` / `uncheckedSyncedDocKeys` tracking to cascade correctly (add to unchecked set on cascading uncheck, remove on cascading check)
- [x] 2.4 Fix `checkedKeys` prop to pass only truly checked keys with computed halfChecked keys (use checkStrictly with manual halfChecked computation)

## 3. Testing

- [x] 3.1 Add tests for `collectAllDescendantKeys`, `computeTriState`, and `computeCascadedCheckedKeys` utility functions
- [x] 3.2 Verify that existing knowledge-base-tree-loading tests still pass
