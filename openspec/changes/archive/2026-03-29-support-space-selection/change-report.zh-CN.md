# 变更报告：support-space-selection

## 基本信息

- **变更名称：** support-space-selection
- **Schema：** spec-driven
- **归档路径：** `openspec/changes/archive/2026-03-29-support-space-selection/`

## 变更动机

知识库同步源树中，space 节点（代表整库）的 checkbox 被禁用，用户无法选择整库进行同步。现有 spec 的 "Build queue from selected knowledge base" 场景已要求支持整库选择，但前端 `disableCheckbox: true` 和 `onCheck` 中 `kind === "space"` 的 early return 阻止了此功能，后端 `validate_selected_sources` 也拒绝了 space kind 在多选组合中出现。

## 变更范围

- **前端：** 移除 space 节点的 `disableCheckbox` 属性，移除 `onCheck` 中对 space kind 的 early return
- **后端：** `validate_selected_sources` 不再因 space kind 拒绝选源，`discover_documents_from_openapi` 的 space 路径已确认可正常工作

## Spec 影响

- **knowledge-base-source-sync：** 新增 4 个场景（Space node checkbox enabled、Selecting space node sets scope、Space-level validation accepts space kind、Space discovery finds all documents via root listing），修改 1 个已有需求描述

## 任务完成情况

| 任务 | 状态 |
|------|------|
| 1.1 移除 space 节点 disableCheckbox | 完成 |
| 1.2 移除 onCheck 中 space early return | 完成 |
| 2.1 validate_selected_sources 允许 space kind | 完成 |
| 2.2 确认 space 路径 discovery 正常 | 完成 |
| 3.1 运行测试确认无回归（29 tests passed） | 完成 |
