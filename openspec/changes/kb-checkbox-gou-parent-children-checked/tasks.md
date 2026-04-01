## 1. Implementation

- [ ] 1.1 Add `expandedCheckedKeys` (or equivalent) in `HomePage.tsx`: union of `scopeKey` from `selectedSources` with `collectCoveredDescendantKeys` across loaded space trees.
- [ ] 1.2 Use expanded set for Tree `checkedKeys`, `computeHalfCheckedKeys`, and `handleTriStateToggle` / `computeTriState`; remove `missingCheckedDescendantsAreCoverageOnly` branch.
- [ ] 1.3 Stop passing coverage keys into `disableCheckbox` in `buildTreeNodes` / `buildTreeData` (only syncing-based disable remains for nodes).

## 2. Validation

- [ ] 2.1 `npx openspec validate --change kb-checkbox-gou-parent-children-checked`
- [ ] 2.2 Run frontend tests / lint as configured in repo (e.g. `npm test` or `npm run build`).
