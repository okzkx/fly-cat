# 变更报告：fix-knowledge-table-sync

## 基本信息

| 项目 | 内容 |
|------|------|
| 变更名称 | fix-knowledge-table-sync |
| 模式 | spec-driven |
| 计划归档路径 | openspec/changes/archive/2026-03-30-fix-knowledge-table-sync/ |

## 变更动机

虽然当前后端已经支持通过 Export Task API 将 `sheet` / `bitable` 导出为 `.xlsx`，但知识库树仍把 bitable 节点视为“不支持”：节点无法直接勾选，父级来源发现时也不会把表格加入同步队列，状态标签始终停留在“不可同步”。这使“知识库内的表格不支持同步”在当前实现中仍是一个真实缺陷。

## 变更范围

- 允许前端把 bitable 叶子节点建模为合法 `SyncScope`，支持直接勾选、去重、汇总与父级覆盖判定
- 知识库树 bitable 节点改为显示正常同步状态，不再固定显示“不支持”
- 后端发现流程在显式选择 bitable 或遍历父级来源时都会将其加入同步队列
- OpenAPI wiki 节点结构补充版本/更新时间解析，供 bitable 增量同步复用
- 增量判定改为按导出类型计算预期输出路径，确保 `.xlsx` 表格可以被正确识别为 unchanged
- 更新主规格文档、TODO 队列与 DONE 记录

## 规格影响

- `openspec/specs/knowledge-base-source-sync/spec.md`
  - 允许 bitable 作为显式同步根，并要求父级来源包含其后代表格叶子
  - 增加 bitable `.xlsx` unchanged 规划场景
- `openspec/specs/knowledge-tree-display/spec.md`
  - bitable 节点改为显示真实同步状态，而非固定“不支持”
- `openspec/specs/sync-focused-application-experience/spec.md`
  - 来源树允许直接选择 bitable，并在父级覆盖/锁定时按普通同步根处理

## 任务完成情况

| # | 任务 | 状态 |
|---|------|------|
| 1.1 | 更新前端 sync-scope 模型与树选择逻辑 | 完成 |
| 1.2 | 更新后端校验与发现逻辑，支持显式/隐式 bitable 入队 | 完成 |
| 2.1 | 将 bitable 树状态改为正常同步状态展示 | 完成 |
| 2.2 | 让 unchanged 判定识别 `.xlsx` 表格输出路径 | 完成 |
| 3.1 | 增加前端 bitable 选择/汇总/覆盖回归测试 | 完成 |
| 3.2 | 增加后端 bitable 发现/unchanged 回归测试并执行检查 | 完成 |

## 关键验证

- `npm test -- tests/knowledge-base-tree-loading.test.ts tests/tree-selection.test.ts tests/sync-selection.test.ts tests/tri-state-checkbox.test.ts`
  - 41 项测试通过
- `cargo test`
  - 30 项测试通过
- `cargo check`
  - 通过
- `npm run typecheck`
  - 仍存在仓库既有的 `tests/run-tauri.test.ts` 两条 `stdout/stderr` 类型错误；本次改动未新增新的 typecheck 错误
