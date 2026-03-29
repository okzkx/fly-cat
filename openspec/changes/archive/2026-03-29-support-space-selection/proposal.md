## Why

知识库树中，space 节点（整库）的 checkbox 被禁用，用户无法选择整库进行同步。现有 spec（knowledge-base-source-sync）的 "Build queue from selected knowledge base" 场景已要求支持整库选择，但前端 `disableCheckbox: true` 和 `onCheck` 中 `kind === "space"` 的 early return 阻止了此功能。后端 `validate_selected_sources` 也阻止 space kind 在多选组合中出现。

## What Changes

- 前端：移除 space 节点的 `disableCheckbox: true`，允许整库节点被勾选
- 前端：`onCheck` 处理中移除 `kind === "space"` 的 early return，允许 space scope 通过 toggleSourceSelection
- 后端：`validate_selected_sources` 允许 space kind 作为唯一选择或在同库组合中出现
- 后端：确保 `discover_documents_from_openapi` 的 space 路径（`node_token` 为 `None`）能正确通过 `list_child_nodes` 发现整库文档

## Capabilities

### New Capabilities

(无新 capability)

### Modified Capabilities

- `knowledge-base-source-sync`: 启用整库（space kind）节点的 checkbox 选择和同步发现，与现有 spec "Build queue from selected knowledge base" 场景对齐

## Impact

- `src/components/HomePage.tsx` — tree 构建（`disableCheckbox`）和 `onCheck` 回调
- `src/utils/treeSelection.ts` — `toggleSourceSelection` 和 `sourceCoversDescendant` 已支持 space kind，无需修改
- `src-tauri/src/commands.rs` — `validate_selected_sources` 和 `discover_documents_from_openapi` 的 space 路径
