# 变更报告：新增强制更新按钮

## 基本信息

- **变更名称**: add-force-update-selected-docs
- **归档日期**: 2026-04-01
- **基础分支**: master

## 执行者身份

- **姓名**: 扫帚猫
- **品种**: 布偶猫
- **职业**: 交互设计师
- **性格**: 细致稳妥，偏爱清爽直接的交互
- **口头禅**: 先把界面扫干净，再让操作顺爪
- **邮箱**: saozhoumao@opencat.dev

## 变更动机

现有首页 **全部刷新** 已经修正为“只处理当前勾选且已同步的叶子，并按原规则条件对齐版本”。剩余任务要求再补一个单独的 **强制更新** 入口，让当前勾选文档无论本地版本高低、缺失与否，都以远端刷新结果覆盖本地版本元数据，同时不能回退刚修好的普通刷新行为。

## 变更范围

- `src/components/HomePage.tsx`：首页工具栏新增 **强制更新** 按钮；`全部刷新` 与 `强制更新` 共用批量刷新流程，但分别走普通/强制两种对齐模式，并各自展示加载与成功提示。
- `src/utils/tauriRuntime.ts`：`alignDocumentSyncVersions(...)` 新增 `force` 参数，向 Tauri 透传对齐模式。
- `src-tauri/src/commands.rs`、`src-tauri/src/storage.rs`：manifest 版本对齐逻辑参数化；普通刷新仍只在“本地更旧或单侧缺失”时写回，强制更新则对所有成功刷新结果把本地 `version` / `update_time` 覆盖为远端值。
- `openspec/specs/knowledge-tree-display/spec.md`：主规格同步成“双按钮 + 不同对齐规则”的最终行为。

## 规格影响

- `knowledge-tree-display`：批量元数据操作从单一 **全部刷新** 扩展为 **全部刷新** + **强制更新** 两个入口，并明确强制更新始终以远端元数据覆盖本地版本显示。

## 任务完成情况

- Purpose / Apply / Archive 流程已完成。
- 验证通过：`npm run typecheck`
- 验证通过：`cargo test aligns_manifest_version_when_remote_is_newer --manifest-path "src-tauri/Cargo.toml"`
- 验证通过：`cargo test keeps_local_version_when_normal_refresh_sees_older_remote --manifest-path "src-tauri/Cargo.toml"`
- 验证通过：`cargo test force_aligns_manifest_version_even_when_remote_is_older --manifest-path "src-tauri/Cargo.toml"`
- 验证通过：`openspec validate --changes "add-force-update-selected-docs"`
