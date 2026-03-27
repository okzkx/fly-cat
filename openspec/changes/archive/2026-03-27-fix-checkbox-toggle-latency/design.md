## Context

当前知识库树使用 Ant Design `Tree` 的勾选与懒加载能力来支持文档分支选择。现有实现里，勾选一个带子文档的文档节点时，会在 `onToggleDocumentSource` 里递归调用 `loadTreeBranch()`，提前把该文档的整棵后代树加载到本地状态，再更新勾选结果。这个额外的远端发现请求会把一次本地状态切换变成耗时操作，并放大到整个子树规模。

## Goals / Non-Goals

**Goals:**
- 让文档复选框点击立即完成本地状态更新，不依赖远端响应
- 保持知识库树按展开逐层懒加载的现有交互模型
- 保留“父文档覆盖全部子文档”的选择语义，并为该交互补齐回归测试

**Non-Goals:**
- 不改变同步任务创建、同步规划或后端 Feishu API 行为
- 不改造整个树组件或引入新的缓存层
- 不强制在未展开的节点上预先展示全部被覆盖的后代节点

## Decisions

### Decision: Remove eager subtree loading from checkbox toggles

勾选和取消勾选文档节点时，只更新 `selectedDocumentSources`，不再调用递归 `loadTreeBranch()` 预加载后代。

Rationale:
- 勾选动作的核心结果只是更新当前选中范围，本地状态足以表达该结果
- 远端发现延迟不应阻塞复选框反馈
- 现有 requirement 只要求展开时按层加载，并未要求勾选时预抓取整棵子树

Alternative considered:
- 保留预加载，但在 UI 上先乐观更新勾选状态。该方案仍会产生不必要的远端负载，且会让“点击后为什么后台仍在拉取整棵树”继续存在

### Decision: Keep descendant disabling lazy and scoped to loaded nodes

被父文档覆盖的后代节点仍通过 `collectCoveredDescendantKeys()` 在已加载节点中禁用；未展开的后代保持未加载状态，待用户显式展开时再按层请求并基于当前选中根即时计算禁用状态。

Rationale:
- 这样可以同时满足“父文档覆盖子文档”和“展开时才加载直接子节点”
- 已有树数据结构和禁用逻辑可以复用，无需新增复杂索引

Alternative considered:
- 在本地缓存一份完整后代索引并提前推导所有覆盖节点。该方案需要额外发现或额外状态维护，收益不足

### Decision: Add regression test for selection path

增加测试来验证：勾选带后代的文档节点不会触发额外的 `listKnowledgeBaseNodes` 级联调用，显式展开时才会继续发起加载。

Rationale:
- 这次问题本质上是交互路径回退到慢路径，适合用行为测试固定

## Risks / Trade-offs

- [风险] 未展开的被覆盖后代在 UI 上不会提前出现禁用态 -> [缓解] 这与按层懒加载模型一致，节点一旦被展开就会立刻基于当前选中根显示正确禁用态
- [风险] 移除递归加载后，部分旧测试可能依赖完整子树常驻内存 -> [缓解] 更新测试以体现真实交互契约：展开触发加载，勾选不触发加载
