## Context

当前知识库目录树使用 Ant Design Tree 组件，配置了 `checkStrictly` 模式，使得父子节点的选中状态完全独立。这种模式导致复选框只有"选中"和"未选中"两种状态，无法显示半选（indeterminate）状态。

Ant Design Tree 组件默认支持三态复选框：
- 打勾（checked）：节点被选中
- 减号（indeterminate/halfChecked）：部分子节点被选中
- 非打勾（unchecked）：节点未被选中

## Goals / Non-Goals

**Goals:**
- 移除 `checkStrictly` 属性，启用 Tree 组件的默认三态复选框行为
- 保持现有的用户选择逻辑（选中/取消选中节点的行为）
- 父节点自动显示减号状态当其子节点只有部分被选中时

**Non-Goals:**
- 不改变现有的选择存储逻辑（selectedSources 仍存储用户实际选中的节点）
- 不改变现有的同步行为

## Decisions

### Decision 1: 移除 checkStrictly 属性

**选择**: 移除 `checkStrictly` 属性，让 Ant Design Tree 自动计算半选状态

**理由**:
- Ant Design Tree 默认支持三态复选框，只需移除 `checkStrictly` 即可启用
- 这是 Ant Design 的标准用法，与飞书文档导出工具的行为一致
- 无需手动计算 `halfChecked` 数组，由组件自动处理

### Decision 2: checkedKeys 格式保持对象格式

**选择**: 继续使用 `{ checked: [...], halfChecked: [...] }` 格式，但由组件自动计算 halfChecked

**理由**:
- 移除 `checkStrictly` 后，Tree 组件会自动计算并填充 `halfChecked` 数组
- 我们只需要提供 `checked` 数组，`halfChecked` 留空数组即可
- 组件会在渲染时自动填充 `halfChecked`

## Risks / Trade-offs

**Risk**: 移除 `checkStrictly` 后，选中父节点会自动选中所有子节点

**Mitigation**: 这是预期行为，符合三态复选框的标准交互模式。用户想要选择部分子节点时，可以直接点击子节点的复选框。
