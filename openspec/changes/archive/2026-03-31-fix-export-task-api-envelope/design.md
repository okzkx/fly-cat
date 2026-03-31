## Context

Feishu documents [创建导出任务](https://open.feishu.cn/document/server-docs/docs/drive-v1/export_task/create) and [查询导出任务结果](https://open.feishu.cn/document/server-docs/docs/drive-v1/export_task/get) with response examples where `ticket` lives in `data` and task fields live in `data.result`. The Rust client used the same patterns as some non-standard responses for other endpoints inconsistently: `call_openapi_json` callers typically drill into `data`, but `create_export_task` used raw `into_json` and assumed a flat body.

## Goals / Non-Goals

**Goals:**

- Align export_task create/query parsing with the official envelope so sheet and bitable export sync obtains a valid ticket and polls correctly.
- Preserve backward-compatible parsing if a root-level `ticket` or `result` appears (mocks, older gateways).

**Non-Goals:**

- Changing CSV `sub_id` requirements, download URL shape, or sync routing for non-export documents.
- Adding live integration tests against Feishu production.

## Decisions

- **Centralize parsing** in small private functions next to `extract_openapi_error`, reused by `create_export_task` and `get_export_task_status`, and covered by unit tests using `serde_json::json!`.
- **Call `extract_openapi_error` on create responses** before reading `ticket`, matching other OpenAPI helpers and returning clear failures when `code != 0`.

## Risks / Trade-offs

- **[Risk]** Defensive root-level fallaways might hide a misconfigured proxy returning wrong shapes → **Mitigation**: prefer `data.*` first; log is not added to keep noise low; errors remain explicit when both paths miss.

## Open Questions

None for this fix.
