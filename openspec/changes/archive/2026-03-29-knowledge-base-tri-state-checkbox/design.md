## Context

The knowledge base tree in `HomePage.tsx` uses Ant Design's `<Tree checkable>` component. Currently, the `onCheck` handler calls `onToggleSource` which toggles a single node's scope in the `selectedSources` array. There is no cascading behavior - checking a folder does not automatically check its children.

The Tree component already receives `checkedKeys` as `{ checked: [...], halfChecked: [] }` with `halfChecked` always empty, meaning half-checked display is not controlled by the application. Ant Design's Tree can compute half-checked states automatically if the parent node's key is NOT in the checked set and some of its children ARE in the checked set.

## Goals / Non-Goals

### Goals
- Implement parent-child cascading check/uncheck behavior
- Tri-state cycling: checked -> indeterminate -> unchecked -> checked
- Optimization: skip indeterminate state when all descendants agree (all checked or all unchecked)
- Leave descendant states unchanged when entering indeterminate state
- Work with the existing `syncedDocTreeKeys` and `uncheckedSyncedDocKeys` mechanism

### Non-Goals
- Changing the sync task creation logic
- Modifying the `selectedScope` / highlight behavior
- Adding new state variables beyond what is necessary

## Decisions

### Decision 1: Compute tri-state from tree data structure rather than checkbox events

**Choice**: Walk the `loadedSpaceTrees` to collect all descendant keys of the clicked node, then determine the current aggregate state (all checked, none checked, mixed).

**Rationale**: The tree data is already available in `loadedSpaceTrees`. Computing from tree data is deterministic and does not depend on Ant Design's internal checkbox event cascade. This avoids issues with `checkStrictly` vs default cascade behavior.

**Alternative considered**: Using Ant Design's built-in `checkStrictly={false}` cascade. This was rejected because it conflicts with the application's need to control exactly which scopes are in `selectedSources` for sync task creation. The built-in cascade operates on tree keys but does not understand `SyncScope` semantics.

### Decision 2: Implement cycling logic in `onCheck` and `onSelect` handlers in HomePage

**Choice**: Add a helper function `computeTriStateAndToggle` that takes the clicked node's key, the tree data, and the current checked keys, then returns the new set of checked keys.

**Rationale**: Keeping the logic close to the Tree component avoids introducing complex state management. The helper function is pure and testable.

### Decision 3: Maintain `syncedDocTreeKeys` / `uncheckedSyncedDocKeys` compatibility

**Choice**: When cascading uncheck, track any newly unchecked synced documents in `uncheckedSyncedDocKeys`. When cascading check, remove descendants from `uncheckedSyncedDocKeys` if they were there.

**Rationale**: The existing mechanism for auto-deleting unchecked synced documents on sync start must continue to work.

## Risks / Trade-offs

- [Performance] Walking tree data on every click: Mitigation - tree depth is limited (knowledge base hierarchy is typically 3-5 levels), and Ant Design lazy-loads children so only loaded nodes are walked.
- [Complexity] The tri-state cycling adds cognitive load: Mitigation - the behavior follows standard file-tree checkbox conventions (e.g., Windows Explorer, VS Code file explorer).
- [Edge case] Nodes with unloaded children: Mitigation - only cascade to loaded/known children. When children are loaded later, the parent state will be recomputed.

## Open Questions

None.
