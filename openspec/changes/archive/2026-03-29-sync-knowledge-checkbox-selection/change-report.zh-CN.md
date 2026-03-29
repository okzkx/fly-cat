# 变更报告：知识库目录多选框与文档名字点击同步

## 基本信息

- **变更名称**: sync-knowledge-checkbox-selection
- **模式**: spec-driven
- **归档路径**: `openspec/changes/archive/2026-03-29-sync-knowledge-checkbox-selection/`

## 变更动机

知识库目录树中，点击文档/目录名称（onSelect）和勾选复选框（onCheck）是两个独立的交互，分别更新不同的状态（selectedScope 和 selectedSources），互不联动。用户点击名称后复选框不会自动勾选，勾选复选框后节点不会高亮，导致操作结果与预期不一致。

## 变更范围

- 修改 `src/components/HomePage.tsx` 中的 `handleSelect` 回调：点击节点名称时同步勾选复选框（受 disableCheckbox 保护）
- 修改 `onCheck` 回调：勾选复选框时同步更新节点高亮
- 同步更新 `sync-focused-application-experience` 规范，新增两个场景描述

## 规范影响

- **MODIFIED** `sync-focused-application-experience > Sync-Oriented Interaction Flow`：追加多选框与高亮同步联动的要求，新增"点击名称勾选复选框"和"勾选复选框高亮节点"两个场景

## 任务完成

全部 8 项任务已完成：

1. handleSelect 同步勾选（实现 + 验证）
2. onCheck 同步高亮（实现 + 验证）
3. 边界行为验证（已同步文档、同步中禁用、bitable 禁用、取消勾选不影响高亮）
