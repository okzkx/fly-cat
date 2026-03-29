## Why

`cargo check` reports 13 warnings in the Rust backend (src-tauri). These warnings indicate dead code (unused functions, unused struct fields, unused variables) that accumulate during development. Zero-warning builds improve code hygiene, make genuine warnings easier to spot, and reflect professional development practices.

## What Changes

- Prefix unused variable `session` with underscore in `commands.rs:2404`
- Allow dead code on `FeishuOAuthTokenInfo.token_type` field in `mcp.rs:128`
- Allow dead code on `SyncWriteResult` struct fields in `sync.rs:51-54` (fields are written during construction and read only in test code)
- Gate `storage_error` and `sync_document_to_disk` in `sync.rs` behind `#[cfg(test)]` since they are only used in the test module
- Gate test-only helper functions in `commands.rs` behind `#[cfg(test)]`: `make_fixture_document`, `fixture_documents_for_scope`, `fixture_documents_for_sources`, `build_scope_from_node`, `build_space_scope`, `find_node_by_scope`, `collect_fixture_documents`, `should_retry_document`

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

(none - this is a code hygiene fix with no behavioral changes)

## Impact

- `src-tauri/src/commands.rs` - add `#[cfg(test)]` to 8 private functions, prefix 1 variable with underscore
- `src-tauri/src/sync.rs` - add `#[cfg(test)]` to 2 functions, add `#[allow(dead_code)]` on struct fields
- `src-tauri/src/mcp.rs` - add `#[allow(dead_code)]` on struct field
- No API changes, no behavioral changes, no dependency changes
