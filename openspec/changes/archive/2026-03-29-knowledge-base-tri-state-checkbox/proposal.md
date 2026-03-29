## Why

The knowledge base tree currently handles checkbox clicks on parent nodes by toggling only the parent node itself. When a user checks a folder or document with descendants, the children are not automatically included. This forces users to manually check each descendant node, which is tedious and unintuitive for folder-level sync operations. A proper tri-state checkbox pattern (checked / indeterminate / unchecked) with cascading behavior is needed.

## What Changes

- Implement tri-state checkbox cycling on parent nodes: checked -> unchecked -> (skip indeterminate when all descendants agree)
- When a parent node is checked, all descendant documents and folders are also checked
- When a parent node is unchecked, all descendant documents and folders are also unchecked
- Indeterminate (half-checked) state appears only when some descendants are checked and some are not
- When toggling from checked to the next state: if all descendants are currently checked, go directly to unchecked (unchecking all); if some descendants are not all checked, go to indeterminate (leave each descendant in its current state)
- When toggling from unchecked to the next state: check self and all descendants
- When toggling from indeterminate to the next state: check self and all descendants
- Simplified two-state behavior: if self and all descendants are all checked or all unchecked, only toggle between checked and unchecked (indeterminate never appears)

## Capabilities

### New Capabilities
_None_

### Modified Capabilities
- `synced-doc-checkbox`: Add cascading parent-child checkbox behavior with tri-state cycling logic, replacing the current single-node toggle behavior

## Impact

- `src/components/HomePage.tsx` - Modify `onCheck` and `onSelect` handlers to implement cascading toggle logic
- `src/utils/treeSelection.ts` - Add helper functions for collecting descendant keys and computing tri-state
- `openspec/specs/synced-doc-checkbox/spec.md` - Update spec with new cascading behavior requirements
