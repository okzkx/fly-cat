# OpenCat 变更报告：local-only-tree-sync-cleanup

## 基本信息

- **变更名称**: `local-only-tree-sync-cleanup`
- **归档目录**: `openspec/changes/archive/2026-04-13-local-only-tree-sync-cleanup/`
- **执行模式**: worktree
- **基础分支**: `master`
- **任务分支**: `opencat/local-only-tree-sync-cleanup`

## 执行者身份

- **展示名 / Git user.name**: 勾勾猫
- **Git user.email**: gougoumao@opencat.dev
- **角色**: 交互设计师（美国短毛猫）
- **经历摘要**: 负责树形多选与同步状态相关交互；本次关注「远端已删但本地仍有文件」的可发现性与可回退清理路径。
- **性格 / 习惯用语**: 警觉耐心；**勾上要稳，取消也得顺爪**。

## 变更动机

已同步文档在飞书侧被删除或移走后，目录树仅反映远端列表，用户看不到本地残留条目，也无法用熟悉的「勾选 → 同步」路径做一致化清理。

## 变更范围

- **后端**（`src-tauri/src/commands.rs` 等）：`list_space_source_tree` 支持可选 `sync_root`，在 OpenAPI 子节点列表之后按 manifest 合并「远端子列表中缺失 document_id」的成功且本地有文件的叶子；发现阶段在文档/多维表 API 失败时回退到 manifest 清理项，并在空间/目录选择后补充未被远端发现覆盖的 manifest 行；同步循环对 `cleanup_local_only` 文档执行与 `remove_synced_documents` 等价的磁盘与 manifest 清理。
- **本地 Agent**（`local_agent.rs`、`localAgentRuntime.ts`）：树查询增加可选 `syncRoot` 查询参数。
- **前端**（`App.tsx`、`runtimeClient.ts`、`HomePage.tsx`、`sync.ts`）：加载子树时传入已解析同步根；树行展示「远端无」标签。

## 规格影响

- `knowledge-tree-display`：新增「远端缺失 manifest 叶子」与「选择后同步清理」两条需求。
- `tauri-desktop-runtime-and-backend`：新增 manifest 感知树列表与发现阶段清理工作项相关需求。

## 任务完成情况

- OpenSpec `tasks.md` 所列实现项均已完成。
- `openspec validate "local-only-tree-sync-cleanup"` 在归档前通过。
- `cargo test`（`src-tauri`）全部通过；`npm run build` 通过。
- **自动化浏览器测试**：未执行 `/opencat-auto-test`；原因：本行为依赖真实飞书会话与本地 manifest 与目录树合并，仓库内 Playwright/夹具路径不覆盖该集成场景；已用 `cargo test` + 生产构建做回归兜底。

## 剩余风险

- 若远端发现因网络/API 异常不完整，理论上可能将仍在线上的文档误判为「仅本地」而进入清理队列；当前仅在「该次任务远端发现集合」与「manifest + 本地文件」同时满足时追加，风险已收敛但仍建议在弱网环境谨慎全选大目录。
