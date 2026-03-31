## 1. 实现

- [x] 1.1 在 `HomePage.tsx` 的 `handleTriStateToggle` 中，在 `computeTriState` 之后按 design 纠正 `currentState`（覆盖子节点且子节点仅因禁用未出现在 checked 集合时，`mixed` → `all-checked`）
- [x] 1.2 自 `treeSelection` 引入 `sourceHasCoveredDescendants`（若需）并复用 `findNodeByKey` 判断子节点 `disableCheckbox`
- [x] 1.3 运行 `npm test` / 现有校验，确认无回归

## 2. 验证

- [x] 2.1 `openspec validate --change fix-knowledge-base-checkbox-uncheck`
