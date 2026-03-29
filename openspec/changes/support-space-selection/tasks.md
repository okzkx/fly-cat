## 1. 前端：启用整库选择

- [x] 1.1 在 `buildTreeData` 中移除 space 节点的 `disableCheckbox: true`
- [x] 1.2 在 `onCheck` 回调中移除 `changedScope.kind === "space"` 的 early return

## 2. 后端：允许 space kind 通过验证

- [x] 2.1 修改 `validate_selected_sources` 允许 space kind 作为唯一选择或在同库多选中出现
- [x] 2.2 确认 `discover_documents_from_openapi` 的 space 路径（`node_token` 为 `None`）能正确通过 `list_child_nodes` 发现整库文档

## 3. 验证

- [x] 3.1 运行现有测试确认无回归
