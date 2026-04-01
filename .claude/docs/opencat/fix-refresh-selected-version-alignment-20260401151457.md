# OpenCat 变更报告：fix-refresh-selected-version-alignment

## 基本信息

- **变更名称**: fix-refresh-selected-version-alignment
- **归档目录**: `openspec/changes/archive/2026-04-01-fix-refresh-selected-version-alignment/`
- **完成时间**: 2026-04-01

## 执行者身份

- **姓名**: 回环猫
- **品种**: 暹罗猫
- **职业**: 界面魔法师
- **性格**: 机敏专注，偏爱小而准的交互设计
- **口头禅**: 轻点一下，流程再转一圈
- **邮箱**: huihuanmao@opencat.dev

## 变更动机

首页 **全部刷新** 之前只会刷新“全部已同步文档”的远端新鲜度，既不跟随当前勾选范围，也不会把本地版本元数据更新到远端值，和任务要求的“勾选项版本对齐”不一致。

## 变更范围

- `HomePage.tsx`：`全部刷新` 现在只处理当前勾选且已同步的叶子文档/多维表格，并在刷新后立即更新本地/远端版本显示。
- `App.tsx` / `tauriRuntime.ts`：新增刷新后重新拉取 `documentSyncStatuses` 的桥接流程。
- `storage.rs` / `commands.rs` / `lib.rs`：新增 manifest 版本对齐 helper 与 `align_document_sync_versions` 命令，把需要对齐的本地版本/更新时间写回 manifest。
- OpenSpec：`fix-refresh-selected-version-alignment` 变更归档，并同步 `knowledge-tree-display` 主规格。

## 规格影响

- `openspec/specs/knowledge-tree-display/spec.md` 更新“Bulk remote freshness refresh”要求，明确按钮只作用于当前勾选且已同步的叶子，并会按规则对齐本地版本元数据。

## 任务完成情况

- 已完成 propose / apply / archive / merge 前验证。
- 验证通过：`npm run typecheck`
- 验证通过：`cargo test aligns_manifest_version_when_remote_is_newer --manifest-path "src-tauri/Cargo.toml"`
- 验证通过：`openspec validate --changes "fix-refresh-selected-version-alignment"`
