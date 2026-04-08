## 基本信息

- 变更名称：`improve-knowledge-tree-expand-animation`
- 归档路径：`openspec/changes/archive/2026-04-08-improve-knowledge-tree-expand-animation`
- 执行模式：`worktree`
- 执行时间：`2026-04-08 15:23`

## 执行者信息

- 展示名：`疾风猫（性能调优师·东方短毛猫）`
- Git `user.name`：`疾风猫`
- Git `user.email`：`jifengmao@opencat.dev`
- 角色：前端性能调优师，专注掉帧动画、超长列表和主线程热点治理

## 变更动机

知识树在已加载节点展开/收起时，标题行渲染和布局负担过重；首次懒加载展开时又会叠加较大的子树挂载成本，导致动画体感发涩。此次变更按最小安全集合处理最直接的前端热点，不引入更深的数据结构重构。

## 变更范围

- 为知识树启用固定高度视口，走 `Tree` 的虚拟滚动渲染路径
- 将节点标题区抽成更轻的独立渲染组件，减少内联 JSX 和包裹层
- 把文档修订号、状态标签、动作按钮收敛到稳定的单行布局，避免 `Space wrap` 触发布局抖动
- 去掉节点级重复 `Object.keys(...)` / `Set` 构造等小开销
- 保持勾选、预览、重新同步、浏览器打开、默认应用打开等现有行为不变

## 规格影响

- 更新主规格：`openspec/specs/knowledge-tree-display/spec.md`
- 新增要求：
  - 知识树使用有界滚动视口，避免展开大子树时无限撑高卡片
  - 节点行保持稳定单行布局，长次级信息优先截断而不是把动作区挤到换行

## 任务完成情况

- [x] 提取知识树标题行为更轻量的独立组件
- [x] 收敛节点级重复计算
- [x] 启用固定高度树视口与虚拟滚动
- [x] 完成类型检查与生产构建验证

## 验证结果

- `npm run typecheck`：通过
- `npm run build`：通过
- `openspec validate "improve-knowledge-tree-expand-animation" --type change`：在 apply 前通过

## 备注

风要顺着跑，帧也不能掉。这次先把最影响展开流畅度的渲染负担降下来；若后续大树场景仍有卡顿，可继续评估全树遍历索引化与懒加载分段挂载。
