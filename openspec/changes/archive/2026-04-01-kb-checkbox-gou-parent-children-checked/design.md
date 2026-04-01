## Context

The knowledge base tree uses `checkStrictly` with keys derived from normalized `selectedSources`. Ancestor scopes that cover descendants (`space`, `folder`, `document` with `includesDescendants`) store only the ancestor key. Descendants were marked `disableCheckbox` via `collectCoveredDescendantKeys`, so users saw inactive boxes instead of a fully checked subtree.

## Goals / Non-Goals

**Goals:**

- When a covering scope is selected, every loaded descendant checkbox renders as checked and is interactive (except syncing/pending per existing rules).
- Tri-state logic uses the same expanded key set so “parent checked” matches gou.md.

**Non-Goals:**

- Changing how sync tasks resolve scopes (still use normalized `selectedSources`).
- Changing Feishu tree loading or API behavior.

## Decisions

1. **Expanded checked-key set for UI** — `useMemo` builds `Set(scopeKeys from selectedSources) ∪ collectCoveredDescendantKeys(per loaded tree)`. Use this set for Tree `checkedKeys`, `computeHalfCheckedKeys`, and `handleTriStateToggle` / `computeTriState`. Rationale: single consistent view of “what is checked” without duplicating entries in persisted `selectedSources`.

2. **Remove coverage-based `disableCheckbox`** — Pass only `syncingKeys` into `buildTreeNodes` for disable logic (empty set for coverage). Rationale: gou.md forbids “cannot check” children when parent is checked; syncing disable remains required by spec.

3. **Delete `missingCheckedDescendantsAreCoverageOnly`** — No longer needed once descendants are in the checked set.

## Risks / Trade-offs

- **Larger checked-key set in React props** — Only keys for loaded nodes; acceptable.
- **User unchecks one child under a folder scope** — Normalization may still collapse to mixed/indeterminate behavior via existing `onToggleSource`; verify tri-state paths still work.
