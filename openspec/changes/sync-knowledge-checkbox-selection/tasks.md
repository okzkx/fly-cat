## 1. handleSelect 同步勾选

- [ ] 1.1 修改 `handleSelect` 回调：在调用 `onScopeChange` 的同时，调用 `onToggleSource(scope, true)` 以勾选复选框
- [ ] 1.2 验证点击节点名称后，复选框状态和 selectedSources 都正确更新

## 2. onCheck 同步高亮

- [ ] 2.1 修改 `onCheck` 回调：当 `info.checked` 为 true 时，在调用 `onToggleSource` 的同时调用 `onScopeChange(changedScope)` 以更新高亮
- [ ] 2.2 验证勾选复选框后，selectedScope 高亮和节点选中样式正确更新

## 3. 边界行为验证

- [ ] 3.1 验证已同步文档默认勾选的节点，点击名称后不会产生副作用
- [ ] 3.2 验证同步中禁用状态的节点，点击名称不会触发勾选
- [ ] 3.3 验证 bitable 类型节点（disableCheckbox）点击名称后不触发勾选
- [ ] 3.4 验证取消勾选复选框后高亮状态不受影响
