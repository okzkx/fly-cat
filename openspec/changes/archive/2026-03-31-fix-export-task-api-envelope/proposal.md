## Why

Table and other export-based sync fails with `export_tasks missing ticket` while the UI reports an unknown pipeline stage. Feishu Open Platform documents the create/query export_task responses with payloads under `data`, but the client previously read `ticket` and `result` at the JSON root, so successful HTTP responses parse as invalid.

## What Changes

- Parse `POST /drive/v1/export_tasks` success bodies using `data.ticket` (with a defensive root-level fallback for tests or proxies).
- Parse `GET /drive/v1/export_tasks/{ticket}` success bodies using `data.result` for `job_status`, `file_token`, and error fields (with a defensive root-level `result` fallback).
- Run `extract_openapi_error` on create-task responses so non-zero `code` surfaces as transport errors instead of “missing ticket”.
- Add unit tests with official response shapes from Feishu documentation.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `tauri-desktop-runtime-and-backend`: Backend Feishu OpenAPI handling for drive export tasks must match the documented `code` / `msg` / `data` envelope.

## Impact

- `src-tauri/src/mcp.rs` (`create_export_task`, `get_export_task_status`, small parsers, tests)
- Sheet/bitable sync via `sync_document_via_export` benefits without call-site changes
