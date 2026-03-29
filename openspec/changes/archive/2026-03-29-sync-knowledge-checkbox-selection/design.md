## Context

当前 `HomePage.tsx` 的 Tree 组件有两个独立的事件处理器：
- `onSelect`（`handleSelect`）：仅调用 `onScopeChange(node.scopeValue)` 更新高亮
- `onCheck`：仅调用 `onToggleSource(changedScope, info.checked)` 更新复选框

两者操作了不同的状态（`selectedScope` vs `selectedSources`），互不联动。用户点击名称后复选框不变，勾选复选框后节点不高亮。

## Goals / Non-Goals

**Goals:**
- 点击节点名称时，同步勾选该节点复选框
- 勾选/取消复选框时，同步更新高亮状态
- 两种交互产生完全一致的选中结果

**Non-Goals:**
- 不改变 `checkStrictly` 模式——父子节点勾选仍然独立
- 不改变已同步文档默认勾选/取消删除的行为
- 不改变同步进行中复选框禁用的逻辑

## Decisions

### Decision 1: 在 HomePage 内部协调同步，而非修改 App 层回调签名

**选择**: 在 `handleSelect` 中额外调用 `onToggleSource`，在 `onCheck` 中额外调用 `onScopeChange`，全部在 `HomePage` 组件内完成。

**理由**: `App.tsx` 的 `onToggleSource` 和 `onScopeChange` 是独立的状态更新函数，各自已经处理了完整的逻辑。在 HomePage 层面做协调不需要修改 `App.tsx` 的回调签名或 `HomePageProps` 类型，改动范围最小。

**替代方案**: 修改 `App.tsx` 合并两个回调为统一的 `onSelectNode` —— 改动范围更大，且会破坏现有回调的独立性。

### Decision 2: 点击名称 = 勾选复选框（始终 toggle on）

**选择**: `handleSelect` 中，无论节点之前是否已勾选，都将其勾选（调用 `onToggleSource(scope, true)`）。不 toggle off。

**理由**: 点击名称的主交互语义是"选中/关注"，与"取消"不对应。如果点击名称能取消勾选，会产生歧义——用户可能只是想查看某节点信息而非取消同步。取消勾选应通过复选框完成。

**替代方案**: 点击名称 toggle 勾选状态——会导致用户不小心取消勾选。

### Decision 3: 勾选复选框 = 更新高亮为当前节点

**选择**: `onCheck` 中，当 `info.checked` 为 true 时，同步调用 `onScopeChange(scope)`。

**理由**: 勾选某个节点时将其设为当前聚焦节点是自然的交互反馈。

### Decision 4: 取消勾选复选框时，高亮回退逻辑

**选择**: 取消勾选时不主动清除高亮。只有当取消勾选的节点恰好是当前 `selectedScope`，且回退到同空间内其他已选节点时才更新。不强制清除高亮。

**理由**: 取消勾选不应干扰用户可能正在进行的其他操作。

## Risks / Trade-offs

- [快速点击可能触发两个状态更新导致闪烁] → React 18 批量更新机制已解决此问题，同一事件循环内的多个 `setState` 调用会被合并
- [已同步文档的默认勾选与点击名称行为冲突] → 已同步文档默认通过 `allCheckedKeys` 勾选，点击名称时调用 `onToggleSource(scope, true)` 不会产生副作用（已经是勾选状态），因此不会冲突
