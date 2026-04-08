---
name: knowledge-tree-expand-animation-diagnosis
overview: 诊断知识库树子目录展开/收起卡顿的可能根因，并按“先量化、再低风险优化、后结构重构”的顺序制定可执行方案，优先改善已加载节点的展开/收起流畅度，同时兼顾首次懒加载展开时的主线程压力。
todos:
  - id: capture-expand-baseline
    content: 用 React Profiler 或浏览器 CPU profile 分别记录“已加载节点展开/收起”和“首次懒加载展开”两类场景的提交耗时与主线程热点
    status: pending
  - id: lighten-tree-row-render
    content: 精简树节点行渲染，减少 titleRender 内部组件数量与重复计算，优先处理版本行、状态标签、Tooltip、按钮区
    status: pending
  - id: enable-windowing
    content: 为知识树提供固定可滚动高度并启用窗口化渲染，避免大树一次性渲染全部可见节点
    status: pending
  - id: reduce-global-tree-traversals
    content: 收敛 expandedCheckedKeys、checkedSyncedDocumentIds、halfCheckedKeys 等全树遍历，改为索引或缓存驱动
    status: pending
  - id: stabilize-tree-node-identity
    content: 降低 buildTreeData 和 buildTreeNodes 的整树重建频率，尽量保持未受影响分支的引用稳定
    status: pending
  - id: smooth-lazy-expand-commit
    content: 优化首次展开时的子树插入时机与次级状态更新顺序，减少异步返回后的单次大提交卡顿
    status: pending
  - id: add-large-subtree-fallback
    content: 为超大子树增加降级策略，例如缩短或关闭动效、分段渲染、先展示骨架再补充次级信息
    status: pending
isProject: false
---

# Knowledge Tree Expand Animation Diagnosis Plan

## 目标

围绕知识库树的子目录展开与收起卡顿问题，先做代码级诊断，再形成一套分阶段的优化计划。目标不是立即大改，而是先确认真正的瓶颈来自哪里，再按收益/风险比推进。

本计划重点区分两类场景：

- 已加载节点的普通展开/收起
- 首次展开未加载节点时的懒加载展开

这两类场景体感都可能表现为“动画不顺”，但根因并不完全相同。

## 当前诊断结论

### 1. 树节点单行渲染过重，是已加载节点展开/收起卡顿的首要嫌疑

`src/components/HomePage.tsx` 的 `Tree.titleRender` 并不是简单标题，而是把以下内容都挂在每一行上：

- 图标
- 标题文本
- 版本对比行 `DocumentFeishuRevisionLine`
- 同步状态标签 `NodeSyncStatusTag`
- 新鲜度图标 `FreshnessIndicator`
- 多个操作按钮（重同步、浏览器打开、默认应用打开）
- 多个 `Tooltip`

这意味着展开/收起时，浏览器并不是只在做树结构动效，而是在处理一批“带操作区的小卡片行”的挂载、卸载、布局和重绘。即使没有新的网络请求，单次动画也会受到行渲染成本拖累。

### 2. 普通展开/收起和首次懒加载展开存在不同瓶颈

#### 已加载节点展开/收起

更像是前端渲染和布局问题：

- 单行节点内容重
- 多个动态图标和标签参与重绘
- 行容器使用 `Space wrap`，会增加换行和高度计算
- 若节点很多，展开/收起时 DOM 变化量本身就大

#### 首次展开未加载节点

除上述问题外，还叠加了异步加载完成后的大块状态更新：

- `App.tsx` 中 `onLoadTreeChildren` 会在请求返回后更新 `loadedSpaceTrees`
- 虽然已经用 `startTransition` 包裹，但 `HomePage` 侧仍会因 `loadedSpaceTrees` 变化触发一系列全树派生计算
- 新子树插入后，整批节点一起挂载，容易与动画抢同一段主线程时间

已有的 `startTransition` 属于正确方向，但只解决了“状态更新优先级”问题，没有解决“更新本身太重”的问题。

### 3. 当前页面在树数据变化后会触发多轮全树遍历

`HomePage.tsx` 中与树相关的派生值较多，且很多都依赖 `loadedSpaceTrees` 或 `treeData`：

- `syncingKeys`
- `expandedCheckedKeys`
- `checkedSyncedDocumentIds`
- `treeData`
- `halfCheckedKeys`

对应辅助函数也大多是整树扫描或递归遍历：

- `collectSyncedDocKeysFromTree`
- `collectDocumentIdsByTreeKeys`
- `collectCoveredDescendantKeys`
- `buildTreeNodes`
- `computeHalfCheckedKeys`
- `collectTreeDataDescendantKeys`
- `findNodeByKey`

这类计算在“首次展开插入子树”时最明显，因为 `loadedSpaceTrees` 变化会让它们重新计算。若树规模较大，单次展开会出现“数据更新 + 派生重算 + 子树挂载”叠加。

### 4. 某些重复小开销会被节点数量放大

有几处不是单次特别重，但在很多节点上重复执行会累计成可感知卡顿：

- `DocumentFeishuRevisionLine` 内部每次渲染都执行 `Object.keys(syncStatuses).length`
- `NodeSyncStatusTag` 内部每次渲染都执行 `Object.keys(syncStatuses).length`
- `syncingKeys` 计算里会在遍历每个 space 时重复构造 `new Set(activeSyncTask.discoveredDocumentIds)`
- `collectCoveredDescendantKeys` 会对每个节点执行一次 `selectedSources.some(...)`

这些操作单独看都不大，但在展开后同时渲染几十到几百个节点时，会放大为主线程噪声。

### 5. 当前知识树没有形成“窗口化渲染”的明确条件

代码中没有看到为 `Tree` 配置固定 `height` 的窗口化方案。即使底层组件支持虚拟列表，也没有形成“只渲染视口内节点”的稳定条件。结果是：

- 节点一多，展开后真实 DOM 数量迅速上升
- 收起前后的布局和重绘范围都更大
- 动画期间更容易掉帧

### 6. 目前没有运行时基线，诊断仍需一次 profile 验证

从代码结构看，瓶颈高度集中在渲染与遍历层；但在真正动手改之前，仍建议补一次基线数据，区分：

- 是 React commit 时间过长
- 还是浏览器 layout / paint 占主导
- 还是两者叠加

如果没有 profile，容易把时间花在收益不高的重构上。

## 根因优先级排序

### P0：节点行渲染和布局过重

最可能直接影响“普通展开/收起已加载节点”的体感。

### P1：树数据变化后的多轮全树遍历

最可能直接影响“首次展开懒加载节点”的体感，也会放大同步状态变化时的卡顿。

### P2：缺少窗口化/固定高度导致 DOM 数量过大

树越大，问题越明显；属于结构性放大器。

### P3：懒加载结果一次性插入过大子树

主要影响首次展开场景。

### P4：次级重复计算和对象重建过多

属于“雪上加霜”，适合作为低风险快修项。

## 建议优化路线

### Phase 0：先量化，不盲改

目标：拿到两类场景的基线数据。

建议记录以下两组 profile：

1. 已加载节点展开/收起
2. 首次展开未加载节点

建议观察指标：

- React commit duration
- 主线程长任务位置
- layout / paint 占比
- 单次展开插入的节点数量
- `HomePage` 的 render 次数

推荐工具：

- React DevTools Profiler
- Chromium Performance / CPU profile

本阶段交付：

- 一份热点截图或文字摘要
- 两类场景各自的主要瓶颈判断

### Phase 1：低风险快修

优先做不改业务语义的优化。

#### 1.1 精简树行结构

- 把树行拆成独立的 `React.memo` 组件，而不是在 `titleRender` 里内联生成整块内容
- 让组件尽量接收 primitive props，避免把大对象整体传入
- 对“版本行 + 状态标签 + 操作按钮”做更明确的职责分层

#### 1.2 去掉节点级重复小开销

- 在父层预先计算 `hasSyncStatuses`，不要在每个节点里 `Object.keys(syncStatuses).length`
- 把 `discoveredDocumentIds` 的 `Set` 构造提到循环外
- 尽量把 `selectedSources.some(...)` 这类判断转换成更可复用的数据结构

#### 1.3 减少布局抖动

- 评估把树行主容器从 `Space wrap` 改成更可控的单行 `flex`
- 把不常用的按钮区做延迟显示、悬浮显示或更稳定的固定宽度布局
- 降低 Tooltip 同时参与布局和重绘的数量

### Phase 2：开启真正的窗口化渲染

目标：减少同一时刻真实渲染的节点数。

建议方向：

- 为知识树容器提供固定高度和滚动区域
- 配置 `Tree` 的窗口化渲染条件
- 验证窗口化后，展开/收起时是否只重排视口附近节点

这是大树场景下收益很高的一步，通常比继续微调单个函数更划算。

### Phase 3：收敛全树遍历与索引构建

目标：让树相关派生状态从“每次重扫整树”转向“基于索引查询”。

建议优先建立的索引：

- `key -> node`
- `key -> descendantKeys`
- `key -> descendantDocumentIds`
- `documentId -> nodeKey`

这样可以减少以下场景的重复扫描：

- 半选态计算
- 勾选覆盖子节点计算
- 已勾选且已同步文档集合计算
- 节点 key 到节点对象的反查

如果不想一次性引入完整索引，也可以先按 `spaceId` 做分片缓存，降低每次展开时被迫扫描全部空间的概率。

### Phase 4：稳定树节点对象引用

目标：避免一处子树变化导致整棵树的 `treeData` 对象大面积重建。

建议方向：

- 优化 `buildTreeData` / `buildTreeNodes`，尽量复用未变化分支
- 懒加载子节点时，只替换命中的那条祖先链，而不是让整个树对象体系重新生成
- 对稳定分支保持引用不变，给 `Tree` 和 memoized row 更多复用空间

这是比 Phase 1/2 更深的结构优化，收益高，但风险也更大，建议在有 profile 证据后再做。

### Phase 5：优化首次懒加载展开的插入体验

目标：缓解“请求回来后一口气塞入整棵子树”的卡顿。

可选方案：

- 先插入轻量 loading/placeholder 行，再分批补充次级信息
- 将“核心树结构插入”和“次级状态展示”拆成两段更新
- 对超大子树使用分段挂载或延后挂载

虽然 `startTransition` 已存在，但如果返回子树很大，仍可能出现单次 commit 太重的问题。

### Phase 6：为超大子树准备降级策略

当节点规模超过某个阈值时，单纯追求完整动画不一定值得。

可考虑：

- 超大子树缩短动画时长
- 超大子树直接关闭展开动效
- 首次展开只展示第一屏子节点，其余延后渲染

这一步不是首选，但作为保险策略很有价值。

## 推荐实施顺序

建议按下面顺序推进，避免一开始就做高成本重构：

1. Phase 0：先 profile，确认热点比例
2. Phase 1：做节点行轻量化和重复计算收敛
3. Phase 2：给树加固定高度和窗口化
4. Phase 3：只在必要时引入索引缓存
5. Phase 4：如果仍卡，再做引用稳定和结构重构
6. Phase 5 / Phase 6：按懒加载子树规模决定是否引入分批挂载或动效降级

## 建议验收标准

- 已加载节点展开/收起时，主观体感明显顺滑，不再出现明显停顿
- 首次展开未加载节点时，请求返回后的子树插入不再出现明显“卡一拍”
- 大树场景下，滚动和展开不会因为单次状态变化导致整页明显掉帧
- 不引入同步勾选、预览、状态标签、按钮行为上的回归

## 风险与取舍

- 仅做 CSS/动画参数微调，大概率治标不治本
- 直接做深层数据结构重构，风险较高，可能影响勾选级联逻辑
- 只做 `startTransition` 级别的调度优化，无法解决节点行本身太重的问题
- 窗口化收益通常很高，但需要接受“树容器高度被约束”的 UI 取舍

## 结论

当前代码最像是“渲染成本过高 + 全树派生计算过多 + 缺少窗口化”的组合问题，而不是单纯动画曲线或时长配置不佳。

如果只选一个最可能的第一落点，优先建议：

1. 为树提供固定高度并启用窗口化
2. 把树行拆成 memoized 轻量组件
3. 去掉节点级重复的 `Object.keys(...)` 和类似小开销

如果这三步后体感仍不够，再进入索引缓存和分支引用稳定化阶段。
