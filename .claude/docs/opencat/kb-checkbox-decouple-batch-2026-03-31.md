# 变更报告：kb-checkbox-decouple-batch

## 基本信息

- **变更名称**: kb-checkbox-decouple-batch
- **归档路径**: `openspec/changes/archive/2026-03-31-kb-checkbox-decouple-batch/`
- **日期**: 2026-03-31

## 执行者身份

- **姓名**: 勾勾猫
- **品种**: 美国短毛猫
- **职业**: 交互设计师
- **性格**: 警觉耐心，喜欢把每一种勾选状态都走一遍
- **口头禅**: 勾上要稳，取消也得顺爪
- **邮箱**: gougoumao@opencat.dev

## 变更动机

按 `.claude/docs/gou.md`：复选框仅用于批量意图，与「是否已同步」脱钩；同步状态由标签展示；开始同步不再因未勾选而删本地；新增批量删除已勾选且已同步的文档。

## 变更范围

- `HomePage.tsx`: `allCheckedKeys` 仅来自 `selectedSources`；移除 `uncheckedSyncedDocKeys` 与 manifest 默认合并；新增「批量删除」与确认对话框；`onCreateTask` 无参。
- `App.tsx` / `types/app.ts`: 去掉开始同步前的 `removeSyncedDocuments` 清理；新增 `onBatchDeleteCheckedSyncedDocuments`。
- 删除 `syncStart.ts` 与 `sync-start.test.ts`。
- OpenSpec: `synced-doc-checkbox`、`knowledge-base-source-sync` 主规格已随归档同步。

## 规格影响

- 新增：勾选与同步状态脱钩、仅勾选创建任务、批量删除已勾选已同步文档。
- 移除：默认勾选已同步、未勾选追踪、`开始同步` 前删除未勾选已同步文档。
- 修改：三态级联、半选计算、`Tri-state respects scope-only` 场景文案。

## 任务完成情况

提案 / 实现 / 归档三检查点已完成；`openspec validate` 通过；`npm test` 与 `npm run build` 通过。
