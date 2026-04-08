# fix-content-fetch-document-summary-rate-limit — 归档报告

## 基本信息

- **变更名称**: `fix-content-fetch-document-summary-rate-limit`
- **归档目录**: `openspec/changes/archive/2026-04-08-fix-content-fetch-document-summary-rate-limit/`
- **日期**: 2026-04-08 14:59

## 执行者

- **展示名 / Git user.name**: 票据猫
- **Git user.email**: piaojumao@opencat.dev
- **角色**: OpenCat 接口锻造师
- **品种**: 俄罗斯蓝猫
- **性格**: 冷静专注，喜欢把异步链路一节一节对齐
- **口头禅**: 票据对上了，链路就通了

## 变更动机

本轮 TODO 报错描述已经从 discovery 收敛到“内容抓取阶段（7项）”，而仓库内复核发现 `FeishuOpenApiClient::fetch_document()` 在抓块内容前仍直接调用 `fetch_document_summary()`。这意味着内容抓取阶段遇到 Feishu `99991400` 限频时，会在进入已有的块级重试逻辑之前就直接失败。

## 变更范围

- `src-tauri/src/mcp.rs`：将内容抓取入口 `fetch_document()` 的文档详情读取切换为 `fetch_document_summary_with_retry()`，复用现有的限频退避逻辑。
- `src-tauri/src/mcp.rs`：新增回归测试，模拟文档详情接口先连续返回两次 `99991400`，随后恢复成功，验证内容抓取路径能够继续进入块读取并完成。

## 规格影响

- `openspec/specs/mcp-markdown-content-pipeline/spec.md`：补充内容抓取阶段的文档详情请求也必须对 `99991400` 做有界重试，避免在真正读取块内容前就误判为内容抓取失败。

## 任务完成情况

- OpenSpec propose / apply / archive 流程已完成。
- `openspec archive fix-content-fetch-document-summary-rate-limit -y` 已执行，并将 delta spec 合并到主规格。

## 验证

- 复核现有代码路径，确认问题仍存在于内容抓取阶段：`fetch_document()` 之前未复用文档详情限频重试。
- `cargo test fetch_document_retries_rate_limited_summary_before_loading_blocks --lib`
- `cargo test mcp::tests --lib`
- `openspec validate "fix-content-fetch-document-summary-rate-limit" --type change`

## 剩余风险

- 本次修复只补齐了内容抓取入口的文档详情限频重试；如果 Feishu 后续在其他尚未覆盖的详情接口上引入不同限频表现，仍需按具体调用点补充保护。
