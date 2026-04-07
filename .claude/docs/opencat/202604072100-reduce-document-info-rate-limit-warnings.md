# reduce-document-info-rate-limit-warnings — 归档报告

## 基本信息

- **变更名称**: `reduce-document-info-rate-limit-warnings`
- **归档目录**: `openspec/changes/archive/2026-04-07-reduce-document-info-rate-limit-warnings/`
- **日期**: 2026-04-07

## 执行者

- **展示名 / Git user.name**: 票据猫
- **Git user.email**: piaojumao@opencat.dev
- **角色**: OpenCat 接口锻造师（飞书 API / 同步链路）

## 变更动机

开发控制台在批量拉取文档元数据或块内容时，飞书频率限制（如 `99991400`）会触发共享重试逻辑；原先每次重试都输出 `[warn]`，在预期可恢复的场景下造成告警泛滥，干扰对真实故障的判断。

## 变更范围

- `src-tauri/src/mcp.rs`：`retry_feishu_rate_limited_request` 在仍有剩余重试次数时不再 `eprintln!` 中间告警；退避与重试次数不变，耗尽时仍输出限频重试耗尽警告。

## 规格影响

- `openspec/specs/tauri-desktop-runtime-and-backend/spec.md`：新增 **Restrained console output for Feishu throttle retries** 需求，约束中间限频重试不得打 `[warn]`，耗尽时仍需明确警告。

## 任务完成情况

- OpenSpec propose / apply / archive 流程已完成；`openspec archive … -y` 已合并 delta 规格。
- `cargo test`（`src-tauri`）81 项通过。

## 验证

- `cargo test`（工作树 `src-tauri`）
- `openspec validate reduce-document-info-rate-limit-warnings --type change`（归档前）

## 剩余风险

- 中间重试过程不再输出日志，若需排查「卡在退避」类问题，需依赖最终失败告警或自行加调试日志。
