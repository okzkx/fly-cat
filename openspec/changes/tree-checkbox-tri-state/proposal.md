## Why

当前知识库目录树使用 `checkStrictly` 模式，导致复选框只有"选中"和"未选中"两种状态。当用户选择一个文件夹时，无法直观地看出该文件夹下是否只有部分子文档被选中。需要引入三态复选框（选中、部分选中/减号、未选中），当子文档未全部被选中时，父节点显示减号状态，提供更清晰的视觉反馈。

## What Changes

- 移除 Tree 组件的 `checkStrictly` 属性，启用 Ant Design Tree 的默认联动行为
- 修改 `checkedKeys` 的计算逻辑，正确计算 `halfChecked` 数组
- 当父节点的子文档只有部分被选中时，父节点显示减号状态（indeterminate）
- 保持现有的选择逻辑：用户选中/取消选中某个节点时，其子节点状态联动更新

## Capabilities

### New Capabilities
- `tree-checkbox-tri-state`: 知识库目录树三态复选框功能，支持选中、部分选中（减号）、未选中三种状态

### Modified Capabilities
- `synced-doc-checkbox`: 扩展现有的复选框逻辑以支持半选状态显示

## Impact

- `src/components/HomePage.tsx`: Tree 组件配置和 checkedKeys 计算逻辑
- `openspec/specs/synced-doc-checkbox/spec.md`: 需要添加三态复选框的需求规范
