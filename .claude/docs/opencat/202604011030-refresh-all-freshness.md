# OpenCat 变更报告：refresh-all-freshness

## 基本信息

- **变更名称**: refresh-all-freshness
- **归档目录**: `openspec/changes/archive/2026-04-01-refresh-all-freshness/`
- **完成时间**: 2026-04-01

## 执行者身份

- **姓名**: 回环猫
- **品种**: 暹罗猫
- **职业**: 界面魔法师
- **性格**: 机敏专注，偏爱小而准的交互设计
- **口头禅**: 轻点一下，流程再转一圈
- **邮箱**: huihuanmao@opencat.dev

## 变更动机

知识库已同步文档的远端版本状态依赖防抖后的自动拉取，缺少用户主动「一键刷新全部」入口；补充该入口可减少对自动时序的依赖，且与现有 `checkDocumentFreshness` / 持久化逻辑一致。

## 变更范围

- `HomePage.tsx`：新增 `syncedIdsForFreshness`、`refreshingAllFreshness`、`handleRefreshAllFreshness`；卡片工具栏增加「全部刷新」按钮（`data-testid="refresh-all-freshness"`）。
- OpenSpec：`knowledge-tree-display` 主规格增加「Bulk remote freshness refresh」需求；变更已归档至 `2026-04-01-refresh-all-freshness`。

## 规格影响

- `openspec/specs/knowledge-tree-display/spec.md` 新增批量远端新鲜度刷新相关需求与场景。

## 任务完成情况

- Purpose / Apply / Archive 流程已完成；`openspec validate`、TypeScript `typecheck`、`vitest` 均已通过。
