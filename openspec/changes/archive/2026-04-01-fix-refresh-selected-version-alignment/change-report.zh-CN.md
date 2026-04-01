# 变更报告：全部刷新勾选版本对齐

## 基本信息

- **变更名称**: fix-refresh-selected-version-alignment
- **归档日期**: 2026-04-01
- **基础分支**: master

## 执行者身份

- **姓名**: 回环猫
- **品种**: 暹罗猫
- **职业**: 界面魔法师
- **性格**: 机敏专注，偏爱小而准的交互设计
- **口头禅**: 轻点一下，流程再转一圈
- **邮箱**: huihuanmao@opencat.dev

## 变更动机

现有 **全部刷新** 只会批量刷新全部已同步文档的远端新鲜度，不看当前勾选范围，也不会把树上展示的本地版本元数据同步到远端版本，和 `TODO.md` 里的修复意图不一致。

## 变更范围

- `src/components/HomePage.tsx`：`全部刷新` 改为只处理当前勾选且已同步的文档/多维表格叶子；刷新后合并更新 `freshnessMap` 并触发状态重载。
- `src/App.tsx`、`src/types/app.ts`、`src/utils/tauriRuntime.ts`：新增刷新后重载同步状态回调与 `alignDocumentSyncVersions(...)` Tauri 桥接。
- `src-tauri/src/storage.rs`、`src-tauri/src/commands.rs`、`src-tauri/src/lib.rs`：新增 manifest 版本对齐逻辑与命令，按“本地低于远端 / 单侧缺失”规则写回本地版本元数据，并补 1 条聚焦回归测试。
- `openspec/specs/knowledge-tree-display/spec.md`：主规格同步到“当前勾选且已同步叶子 + 刷新后对齐本地版本”的最终行为。

## 规格影响

- `knowledge-tree-display`：批量刷新从“全部已同步文档”调整为“当前勾选且已同步叶子”，并新增刷新后本地版本元数据对齐要求。

## 任务完成情况

- Purpose / Apply / Archive 流程已完成；`npm run typecheck`、`cargo test aligns_manifest_version_when_remote_is_newer --manifest-path "src-tauri/Cargo.toml"`、`openspec validate --changes "fix-refresh-selected-version-alignment"` 均已通过。
