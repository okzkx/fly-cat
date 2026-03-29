# 变更报告：知识库目录三态复选框

## 基本信息

- **变更名称**: knowledge-base-tri-state-checkbox
- **状态**: 已完成
- **归档路径**: openspec/changes/archive/2026-03-29-knowledge-base-tri-state-checkbox/

## 变更动机

知识库目录树的复选框点击只切换单个节点本身，不级联影响子文档。用户需要手动逐个勾选子节点才能选中整个目录，操作繁琐。需要实现标准的三态复选框模式（勾选 / 方块 / 取消），支持父子级联行为。

## 变更范围

### 修改文件
- `src/components/HomePage.tsx` - 重写 `onCheck` 和 `onSelect` 处理器，实现三态级联切换逻辑
- `src/utils/treeSelection.ts` - 新增 `collectAllDescendantKeys`、`computeTriState`、`computeCascadedCheckedKeys` 三个工具函数
- `tests/tri-state-checkbox.test.ts` - 新增 15 个单元测试覆盖三态切换逻辑

### 规范影响
- `synced-doc-checkbox` 规范新增 2 条需求：级联父子复选框切换、父节点半选中状态计算

## 任务完成情况

全部 8 项任务已完成：
1. 新增 `collectAllDescendantKeys` 工具函数
2. 新增 `computeTriState` 工具函数
3. 新增 `computeCascadedCheckedKeys` 工具函数
4. 重写 `onCheck` 处理器使用三态循环逻辑
5. 更新 `onSelect` 处理器使用相同的三态切换逻辑
6. 更新 `syncedDocTreeKeys` / `uncheckedSyncedDocKeys` 跟踪以正确级联
7. 使用 `checkStrictly` + 手动计算 `halfChecked` 替代显式空数组
8. 新增 15 个单元测试，原有 6 个测试全部通过

## 技术决策

- 使用 `checkStrictly` 模式禁用 Ant Design 默认级联，手动计算 halfChecked 键
- 三态切换逻辑：全选 -> 取消全选，未选 -> 全选，混合 -> 全选
- 当自身和所有子节点状态一致时，跳过方块状态，只在勾选和取消之间切换
