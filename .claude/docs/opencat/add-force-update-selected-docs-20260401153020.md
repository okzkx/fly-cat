# OpenCat 变更报告：add-force-update-selected-docs

## 基本信息

- **变更名称**: add-force-update-selected-docs
- **归档目录**: `openspec/changes/archive/2026-04-01-add-force-update-selected-docs/`
- **完成时间**: 2026-04-01

## 执行者身份

- **姓名**: 扫帚猫
- **品种**: 布偶猫
- **职业**: 交互设计师
- **性格**: 细致稳妥，偏爱清爽直接的交互
- **口头禅**: 先把界面扫干净，再让操作顺爪
- **邮箱**: saozhoumao@opencat.dev

## 变更动机

首页已有的 **全部刷新** 现在承担“查看当前勾选项远端状态并按原规则条件对齐”的职责，但队列中的剩余任务还需要一个更直接的 **强制更新** 入口，让用户在版本高低、缺失与否都不想判断时，能够直接把当前勾选且已同步的文档版本元数据强制与远端保持一致。

## 变更范围

- `HomePage.tsx`：新增 **强制更新** 按钮，并与 **全部刷新** 共用批量刷新流程。
- `tauriRuntime.ts`：对齐桥接增加 `force` 开关。
- `storage.rs` / `commands.rs`：manifest 对齐逻辑拆成普通模式与强制模式，并补充“不回退普通刷新规则”和“强制覆盖较高本地版本”两条回归测试。
- OpenSpec：归档 `add-force-update-selected-docs`，同步 `knowledge-tree-display` 主规格，清理 `TODO.md` 并追加 `DONE.md` 记录。

## 规格影响

- `openspec/specs/knowledge-tree-display/spec.md` 现在明确要求：
  - **全部刷新** 继续沿用条件对齐规则。
  - **强制更新** 对成功刷新的当前勾选已同步叶子始终以远端版本/时间覆盖本地展示元数据。

## 任务完成情况

- 已完成 propose / apply / archive / merge 前验证。
- 验证通过：`npm run typecheck`
- 验证通过：`cargo test aligns_manifest_version_when_remote_is_newer --manifest-path "src-tauri/Cargo.toml"`
- 验证通过：`cargo test keeps_local_version_when_normal_refresh_sees_older_remote --manifest-path "src-tauri/Cargo.toml"`
- 验证通过：`cargo test force_aligns_manifest_version_even_when_remote_is_older --manifest-path "src-tauri/Cargo.toml"`
- 验证通过：`openspec validate --changes "add-force-update-selected-docs"`
