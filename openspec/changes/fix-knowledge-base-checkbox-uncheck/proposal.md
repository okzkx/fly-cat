## Why

勾选知识库树中「覆盖子节点」的范围（知识库、目录、含子文档的文档）后，再点复选框无法进入取消勾选路径；用户只能反复看到「全选」语义，体验上等同于无法取消打勾。

## What Changes

- 在 `HomePage` 的三态切换中，当当前节点在 `selectedSources` 语义上已覆盖子节点且仅父级 key 出现在 `allCheckedKeys` 时，将 `computeTriState` 的「混合」结果纠正为「全选」，使下一次点击走取消勾选分支。
- 若存在**未勾选且仍可交互**的子节点（未被父级覆盖禁用），仍保持混合态与规格中的「先半选再全选」行为。

## Capabilities

### New Capabilities

_None_

### Modified Capabilities

- `synced-doc-checkbox`: 澄清「覆盖子节点」的选中在树 key 合并下的三态判定，保证可循环到取消勾选。

## Impact

- `src/components/HomePage.tsx`（三态判定辅助逻辑）
- `openspec/specs/synced-doc-checkbox/spec.md`（补充场景说明）
