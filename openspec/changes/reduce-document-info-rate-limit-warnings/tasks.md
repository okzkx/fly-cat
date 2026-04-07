## 1. Implementation

- [ ] 1.1 Remove intermediate `[warn]` logging from `retry_feishu_rate_limited_request` while preserving backoff and final exhaustion warning in `src-tauri/src/mcp.rs`.

## 2. Verification

- [ ] 2.1 Run `cargo test` for the `feishu_docs_sync` / lib crate so `mcp.rs` unit tests for the retry helper still pass.
