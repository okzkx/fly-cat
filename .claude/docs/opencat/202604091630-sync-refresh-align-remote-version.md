# 归档报告：sync-refresh-align-remote-version

## 基本信息

- **变更名称**: `sync-refresh-align-remote-version`
- **归档目录**: `openspec/changes/archive/2026-04-09-sync-refresh-align-remote-version/`
- **日期**: 2026-04-09

## 执行者身份

- **展示名 / Git user.name**: 回环猫
- **Git user.email**: huihuanmao@opencat.dev
- **角色**: 界面魔法师
- **品种**: 暹罗猫
- **性格**: 机敏专注，偏爱小而准的交互设计
- **口头禅**: 轻点一下，流程再转一圈
- **背景摘要**: OpenCat 团队的界面魔法师，擅长把复杂列表上的批量操作拆成清晰、可预期的单点动作，关注按钮状态与流程衔接。

## 变更动机

**全部刷新** 误走「清理本地 + 创建同步任务」路径，与「仅对齐远端元数据与 manifest 版本、不拉取正文」的预期不符；**开始同步** 应只负责尚未 **已同步**（无对应本地输出）的文档下载，不应通过刷新按钮间接触发对「仅版本漂移」文档的重新拉取。

## 变更范围

- `src/components/HomePage.tsx`：`handleBulkFreshnessAction("refresh")` 改为 `checkDocumentFreshness` → `alignDocumentSyncVersions(..., true)` → 持久化 freshness；移除 `prepareForceRepulledDocuments`、刷新路径下的 `onCreateTask` / `onResumeTasks`；删除仅服务于该错误路径的 `freshnessNeedsResync`、`collectDocumentScopesByTreeKeys`、`checkedDocumentScopeMap`。
- OpenSpec：`knowledge-tree-display` 增量已合并入主规格；新增「默认同步任务仅下载未同步正文」要求。

## 规格影响

- **MODIFIED** `Bulk remote freshness refresh`：**全部刷新** 明确为强制对齐 manifest 与远端（成功检查前提下）、禁止启同步任务与删文件。
- **ADDED** `Default sync task only downloads unsynced document bodies`：明确 **开始同步** 对 unchanged 文档跳过且不单独因远端漂移写回 manifest 版本。

## 任务完成情况

- Purpose / apply / archive 已完成；`tasks.md` 任务已全部勾选。
- 验证：`openspec validate`、`npm run typecheck`、`npm test`（92 tests）均通过。

## 残留风险

- **全部刷新** 使用与 **强制更新** 元数据阶段相同的 forced alignment：若本地 manifest 版本高于远端（罕见），也会按远端回写；与产品「以远端为版本真源」一致，但需在对外说明中与「强制更新」区分（后者另含删文件与拉取）。
