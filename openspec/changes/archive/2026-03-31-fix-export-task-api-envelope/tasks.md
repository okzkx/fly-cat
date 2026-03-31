## 1. Implementation

- [x] 1.1 Add envelope-aware parsing for create export_task (`data.ticket`, optional root fallback) and check `code` via `extract_openapi_error`.
- [x] 1.2 Add envelope-aware parsing for query export_task (`data.result`, optional root fallback).
- [x] 1.3 Add unit tests with JSON shapes from Feishu Open Platform documentation.

## 2. Verification

- [x] 2.1 Run `openspec validate --change fix-export-task-api-envelope`.
- [x] 2.2 Run `cargo test -p <crate>` for the Tauri backend crate covering `mcp` tests.
