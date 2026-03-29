# 变更报告：remove-chinese-labels

## 基本信息

- **变更名称**: remove-chinese-labels
- **工作流**: spec-driven
- **归档路径**: `openspec/changes/archive/2026-03-29-remove-chinese-labels/`

## 变更动机

知识库树节点中显示了中文类型标签（整库、目录、文档、含子文档、多维表格），但这些信息已通过节点图标（云朵、文件夹、文件、表格）清晰表达，标签属于冗余信息。移除这些标签可减少视觉噪音，使树结构更简洁。

## 变更范围

- 移除 `src/components/HomePage.tsx` 中知识树节点渲染器的 5 个 `<Tag>` 元素
- 涉及节点类型：space、folder、document、document（含子文档）、bitable

## 规格影响

- 新增规格：`knowledge-tree-display` — 定义知识树节点仅显示图标和标题，不再显示中文类型标签

## 任务完成情况

- [x] 1.1 移除 HomePage.tsx 中 5 个中文类型 Tag 标签 — 已完成
