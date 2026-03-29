## Context

知识库目录树使用 Ant Design Tree 组件，有两个交互入口：
- `onSelect`（handleSelect）：用户点击节点名称，触发高亮和选中
- `onCheck`：用户点击复选框，触发选中状态切换

当前 handleSelect 总是调用 `onToggleSource(scope, true)`（总是 check），而 onCheck 使用 `info.checked`（toggle）。两者的 uncheckedSyncedDocKeys 追踪逻辑也不同步。

## Goals / Non-Goals

**Goals:**
- handleSelect 行为改为 toggle，与 onCheck 一致
- handleSelect 中同步更新 uncheckedSyncedDocKeys，逻辑与 onCheck 完全对齐
- 两种交互路径产生的状态完全一致

**Non-Goals:**
- 不修改 onCheck 回调的现有逻辑
- 不修改 Tree 组件的其他行为（展开、加载子节点等）
- 不改变 uncheckedSyncedDocKeys 的语义或消费方式

## Decisions

1. **通过 allCheckedKeys 判断当前选中状态再 toggle**：在 handleSelect 中，先检查 `allCheckedKeys.has(nodeKey)` 获取当前 checked 状态，然后取反作为 `shouldBeChecked` 传给 `onToggleSource`。这确保点击名字的行为与点击复选框完全一致。

2. **复用 onCheck 中的 uncheckedSyncedDocKeys 追踪逻辑**：将 onCheck 中对 `syncedDocTreeKeys` 的判断和 `setUncheckedSyncedDocKeys` 的更新逻辑完整复制到 handleSelect 中，保证两条路径状态一致。

## Risks / Trade-offs

- [重复逻辑] handleSelect 和 onCheck 中的 uncheckedSyncedDocKeys 更新逻辑相同 → 当前仅两处使用，重复可接受；如果未来扩展可提取为共享函数
