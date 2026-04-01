## Why

Per `.claude/docs/gou.md`, when a parent checkbox is checked, every child must appear checked. The tree currently marks covered descendants with `disableCheckbox` and omits their keys from the checked-key set, so children look gray and inert instead of fully checked—contradicting the product rule.

## What Changes

- Merge **display** checked keys: union of `selectedSources` keys with all loaded descendant keys covered by a parent/space/folder/`includesDescendants` selection, so the Tree shows every descendant as checked when the parent is checked.
- Stop disabling checkboxes solely because an ancestor scope covers the node; keep disabling only for active sync **syncing/pending** as specified.
- Update `synced-doc-checkbox` spec: remove coverage-based disabled-checkbox requirement; state that a fully checked parent implies all loaded descendants render checked and remain togglable per tri-state rules.

## Capabilities

### New Capabilities

_None_

### Modified Capabilities

- `synced-doc-checkbox`: Align parent/child display and interaction with gou.md (checked parent ⇒ all children checked visually; no coverage-only disabled checkboxes).

## Impact

- `src/components/HomePage.tsx` — expanded checked-key set for Tree; `buildTreeNodes` / `buildTreeData` no longer pass coverage disabled keys.
- `openspec/specs/synced-doc-checkbox/spec.md` — delta applied on archive.
