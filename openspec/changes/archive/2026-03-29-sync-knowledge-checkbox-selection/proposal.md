## Why

知识库目录树中，点击文档/目录名称（onSelect）和勾选复选框（onCheck）是两个独立的交互，分别更新 `selectedScope`（高亮）和 `selectedSources`（勾选），但两者之间没有同步。用户点击名称后复选框不会自动勾选，勾选复选框后节点不会高亮，导致操作结果与用户预期不一致，容易造成困惑。

## What Changes

- 点击文档/目录名称时，除了更新高亮（selectedScope），同时自动将该节点加入 selectedSources（勾选复选框）
- 点击复选框时，除了更新 selectedSources，同时将该节点的 scope 设为 selectedScope（高亮显示）
- 取消勾选复选框时，如果该节点恰好是当前 selectedScope，将 selectedScope 回退到合理的默认值
- 两种操作产生的选中结果完全一致，不再有"选中但未勾选"或"勾选但未选中"的分离状态

## Capabilities

### New Capabilities

（无新增能力）

### Modified Capabilities

- `sync-focused-application-experience`: Tree 组件的选中行为从"选择 + 勾选"分离改为同步联动

## Impact

- `src/components/HomePage.tsx`: 修改 `handleSelect` 和 `onCheck` 回调逻辑，实现双向同步
- `src/App.tsx`: `onScopeChange` 回调可能需要同步触发 `onToggleSource`，或由 HomePage 内部协调
- `src/types/app.ts`: `HomePageProps` 回调签名可能需要调整以支持同步操作
