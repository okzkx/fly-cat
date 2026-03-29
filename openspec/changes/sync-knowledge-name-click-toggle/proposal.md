## Why

知识库目录树中，点击文档/目录名称（handleSelect）当前总是将复选框设为 checked，而点击复选框（onCheck）则是 toggle 行为。两者不一致导致用户点击已选中节点名称时无法取消选中，操作结果与点击复选框的行为矛盾。此外，handleSelect 中缺少对 uncheckedSyncedDocKeys 状态的同步追踪，导致已同步文档的取消勾选状态在两种操作路径下不一致。

## What Changes

- 点击文档/目录名称时，改为 toggle 复选框（与 onCheck 行为一致），而非总是 check
- handleSelect 中增加 uncheckedSyncedDocKeys 的同步更新逻辑，与 onCheck 回调保持一致
- 两种操作产生的选中结果和 uncheckedSyncedDocKeys 状态完全一致

## Capabilities

### New Capabilities

（无新增能力）

### Modified Capabilities

- `sync-focused-application-experience`: handleSelect 回调从"总是 check"改为"toggle"，并添加 uncheckedSyncedDocKeys 同步追踪

## Impact

- `src/components/HomePage.tsx`: 修改 handleSelect 回调中的 onToggleSource 调用参数和 uncheckedSyncedDocKeys 状态更新逻辑
