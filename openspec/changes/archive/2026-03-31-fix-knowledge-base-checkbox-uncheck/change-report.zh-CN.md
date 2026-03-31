# 变更报告：fix-knowledge-base-checkbox-uncheck

## 基本信息

- **变更名称**: fix-knowledge-base-checkbox-uncheck
- **归档日期**: 2026-03-31
- **基础分支**: master

## 变更动机

知识库树中对「覆盖子节点」的范围（知识库、目录、含子文档的文档）勾选后，`allCheckedKeys` 仅含父级 scope key，子节点因覆盖被禁用且 key 未单独入集，`computeTriState` 误判为 `mixed`，后续点击走「全选」分支而无法取消勾选。

## 变更范围

- `src/components/HomePage.tsx`：三态判定前增加「缺失子 key 是否均为覆盖禁用」的校正逻辑；引入 `sourceHasCoveredDescendants` 与辅助函数 `missingCheckedDescendantsAreCoverageOnly`。
- `openspec/specs/synced-doc-checkbox/spec.md`：新增「Tri-state respects scope-only keys for covered descendants」需求与场景。

## 规格影响

- 主规格 `synced-doc-checkbox` 已合并归档增量。

## 任务完成情况

- proposal / design / specs / tasks 已完成；实现与 `openspec validate` 通过；`npm test` 82 项通过。
