## Why

知识库树在同步任务进行时，单篇文档节点仍显示「等待同步」，与目录节点已采用的「同步中 X/Y」进度样式不一致；父文档（含子文档）也未按子树汇总进度，用户难以从树上对齐参考工程/目录行的反馈。

## What Changes

- 进行中的同步任务下，已纳入发现集合且尚未写入 manifest 的文档/多维表格叶子节点改为显示与目录一致的 **同步中 X/Y** 处理中标签（`processing` 色）。
- 当文档或多维表格节点在树上已加载子节点时，其同步状态标签改为按 **子树聚合**（与文件夹节点相同的聚合规则与样式），以反映子文档的同步与进度。

## Capabilities

### New Capabilities

- （无）

### Modified Capabilities

- `knowledge-tree-display`: 更新「元数据标签」相关需求与场景，将「等待同步」改为「同步中 X/Y」，并补充父文档子树聚合场景。

## Impact

- 前端：`src/components/HomePage.tsx` 中 `DocumentSyncStatusTag`、`NodeSyncStatusTag` 的分支与文案。
- 规格：`openspec/specs/knowledge-tree-display/spec.md` 在归档时通过 delta 合并更新。
