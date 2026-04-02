## 基本信息

- 变更名称：`fix-discovery-document-summary-rate-limit`
- 基础分支：`master`
- 任务分支：`opencat/fix-discovery-document-summary-rate-limit`
- 执行者：票据猫（接口锻造师·俄罗斯蓝猫）

## 变更动机

知识库勾选后启动同步时，发现阶段会批量调用 Feishu 文档详情接口。接口偶发返回 `code=99991400` 的限频错误时，旧实现直接终止整个 discovery，导致同步任务被误判为失败。

## 变更范围

- 在 `src-tauri/src/mcp.rs` 中抽取 Feishu 限频识别与指数退避重试 helper。
- 为 discovery 路径新增 `fetch_document_summary_with_retry()`，仅在同步任务创建时的文档信息抓取中启用。
- 复用同一 helper 简化现有子块限频重试实现。
- 更新 `knowledge-base-source-sync` 主规格与变更归档说明。

## 规格影响

- `knowledge-base-source-sync`：Knowledge Base Scoped Discovery 新增 discovery 阶段文档信息限频重试约束。

## 任务完成情况

- [x] 修复 discovery 阶段文档详情请求遇到 `99991400` 时的直接失败
- [x] 保持权限/非限频错误仍然快速暴露
- [x] 新增两条 Rust 单测覆盖重试与非重试行为
- [x] `cargo test --lib`
- [x] `openspec validate --changes "fix-discovery-document-summary-rate-limit"`
