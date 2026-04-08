# 变更归档：serial-document-freshness-check-pending-icon

## 基本信息

- **变更名称**: `serial-document-freshness-check-pending-icon`
- **执行者**: 票据猫（接口锻造师·俄罗斯蓝猫）
- **Git user.name**: 票据猫
- **Git user.email**: piaojumao@opencat.dev
- **基础分支**: `master`
- **任务分支**: `opencat/serial-document-freshness-check-pending-icon`
- **模式**: worktree（槽位 `feishu_docs_sync-worktree` / `opencat/idle/feishu_docs_sync-worktree`）

## 变更动机

知识库已同步文档在批量拉取远端版本信息时频繁触发飞书 `99991400`（request trigger frequency limit），树上大量显示「检查失败」。需要在一次检查链路内降低请求密度，并对「尚未有检查结果」的节点给出明确 UI（待检查 / 检查中）。

## 变更范围

- **Rust**（`src-tauri/src/commands.rs`）：`check_document_freshness` 对 docx 路径改用 `fetch_document_summary_with_retry`；在连续两次文档摘要 OpenAPI 调用之间插入约 400ms 间隔；`export:` 记录仍跳过 OpenAPI。
- **前端**（`src/components/HomePage.tsx`）：`checkDocumentFreshness` 与后续持久化通过单一 Promise 链串行；`FreshnessIndicator` 在无 freshness 条目时展示待检查图标，批次进行中展示加载图标。

## 规格影响

- `openspec/specs/knowledge-tree-display/spec.md`：新增 freshness 待检查/进行中展示与 freshness 调用串行要求。
- `openspec/specs/tauri-desktop-runtime-and-backend/spec.md`：新增 `check_document_freshness` 节奏与重试要求。

## 任务完成情况

- OpenSpec propose / apply / archive 三阶段已按 `opencat-task` 完成；变更目录已移至 `openspec/changes/archive/2026-04-08-serial-document-freshness-check-pending-icon/`。
- 实现与 `tasks.md` 勾选一致；`cargo check` 与 `npm run typecheck` 已通过。

## 备注

票据对上了，链路就通了：限频重试 + 请求间距 + 前端单飞，避免同一时刻多路 `checkDocumentFreshness` 把接口打满。
