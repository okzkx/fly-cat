## Context

`allCheckedKeys` 由 `selectedSources` 的 `scopeKey` 与已同步文档默认勾选合并而来。勾选目录或「含子文档」的文档时，`normalizeSelectedSources` 只在集合中保留父级 scope，子节点 key 不会逐个进入 `allCheckedKeys`，但子节点会因 `collectCoveredDescendantKeys` 被禁用复选框。

`computeTriState` 仅统计 `[nodeKey, ...loadedDescendantKeys]` 中有多少 key 落在 `allCheckedKeys`。父级在集合内、子级不在时会被判为 `mixed`。`computeCascadedCheckedKeys` 对 `mixed` 走「全选子 key」分支，且 `handleTriStateToggle` 的 `else` 再次 `onToggleSource(..., true)`，无法进入 `all-checked → unchecked`。

## Goals / Non-Goals

**Goals:**

- 在「子节点仅因父级覆盖而未单独出现在 checked key 集合」时，将三态视为 `all-checked`，使再次点击可取消勾选。
- 若子节点有**未勾选且未禁用**的复选框（真实混合），不改变现有混合 → 全选 → 取消的规格路径。

**Non-Goals:**

- 不改为 `checkStrictly={false}`，不改变 Ant Design Tree 受控模式整体结构。
- 不改动同步任务创建与 `uncheckedSyncedDocKeys` 的合并策略（除上述判定修正带来的正常副作用外）。

## Decisions

### Decision 1: 在 `handleTriStateToggle` 内修正 `currentState`

在调用 `computeCascadedCheckedKeys` 之前：若 `sourceHasCoveredDescendants(node.scopeValue)`、`allCheckedKeys` 含当前 `nodeKey`，且 `computeTriState` 为 `mixed`，则对每个已加载子 key：若不在 `allCheckedKeys` 中，则要求对应树节点 `disableCheckbox` 为真（表示仅因覆盖而未出现 key）；若存在未勾选且仍可交互的子节点，则不修正。满足时把 `currentState` 设为 `all-checked`。

### Decision 2: 不修改 `computeTriState` 通用函数

保持 `treeSelection.ts` 的纯函数语义；边界知识留在 UI 层，避免影响其它潜在调用方。

## Risks

- 若未来出现「父级覆盖但子级未禁用且未入 checked 集合」的数据不一致，可能仍误判；当前树构建与 `collectCoveredDescendantKeys` 一致时可接受。
