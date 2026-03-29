# 变更报告：knowledge-tree-all-node-metadata

## 基本信息

- **变更名称：** knowledge-tree-all-node-metadata
- **归档路径：** `openspec/changes/archive/2026-03-29-knowledge-tree-all-node-metadata/`

## 变更动机

此前同步状态元数据仅在文档节点上显示，用户无法一目了然地查看知识库、目录等父级节点的整体同步进度。

## 变更范围

- 为所有树节点类型（知识库/空间、目录、文档、多维表格）添加同步状态标签
- 知识库和目录节点显示聚合摘要（如 "3/10 已同步"、"全部已同步"、"未同步"）
- 多维表格节点显示"不支持"标签
- 文档节点保持原有逐条状态标签不变

## 规范影响

- **修改规范：** `knowledge-tree-display` — 新增"非文档节点元数据展示"需求

## 任务完成情况

| 任务 | 状态 |
|------|------|
| 1.1 添加 `collectDescendantDocumentIds` 递归工具函数 | 已完成 |
| 2.1 创建 `NodeSyncStatusTag` 统一分发组件 | 已完成 |
| 2.2 实现聚合标签逻辑 | 已完成 |
| 3.1 在 `titleRender` 中集成 `NodeSyncStatusTag` | 已完成 |
