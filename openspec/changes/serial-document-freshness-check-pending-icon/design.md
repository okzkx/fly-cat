## Context

`check_document_freshness` 已在单线程循环中按文档 ID 顺序调用 OpenAPI，但连续请求仍可能触发飞书频率限制；同时前端可能在防抖自动检查与「全部刷新」之间并发发起多次 `invoke`。

## Decisions

1. **后端节奏**：对走 `docx` 文档摘要 API 的每个文档，在**上一次**同类 API 调用之后、`fetch_document_summary_with_retry` 之前插入固定毫秒休眠（约 350–400ms），与现有 `retry_feishu_rate_limited_request` 的退避互补。`export:` 类记录不调用该 API，不插入间隔。
2. **重试**：将 `fetch_document_summary` 替换为 `fetch_document_summary_with_retry`，与仓库内其他文档信息读取路径一致。
3. **前端串行**：使用 `useRef` 保存 Promise 链，`checkDocumentFreshness` + 持久化的工作单元入队执行，保证全局至多一个 freshness 批次在进行。
4. **UI**：`FreshnessIndicator` 在 `synced` 且无 `freshnessMap[id]` 时：若当前有 freshness 批次在执行则 `LoadingOutlined`；否则 `ClockCircleOutlined` 表示待检查。

## Risks / trade-offs

- 文档数量很大时，单次全量检查总时长增加；用间隔换稳定性，符合「一个一个检查」的产品预期。

## Migration

无需数据迁移；已有持久化 freshness 文件继续有效。
