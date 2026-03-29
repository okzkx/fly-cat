## 1. Fix unused variable

- [x] 1.1 Prefix `session` with underscore in `commands.rs:2404` to `_session`

## 2. Fix unused struct fields in mcp.rs

- [x] 2.1 Add `#[allow(dead_code)]` to `FeishuOAuthTokenInfo.token_type` field in `mcp.rs:128`

## 3. Fix unused struct fields in sync.rs

- [x] 3.1 Add `#[allow(dead_code)]` to `SyncWriteResult` fields (`output_path`, `image_assets`, `content_hash`, `source_signature`) in `sync.rs:51-54`

## 4. Gate test-only functions in sync.rs

- [x] 4.1 Add `#[cfg(test)]` to `storage_error` function in `sync.rs:231`
- [x] 4.2 Add `#[cfg(test)]` to `sync_document_to_disk` function in `sync.rs:321`

## 5. Gate test-only functions in commands.rs

- [x] 5.1 Add `#[cfg(test)]` to `make_fixture_document` in `commands.rs:774`
- [x] 5.2 Add `#[cfg(test)]` to `fixture_documents_for_scope` in `commands.rs:944`
- [x] 5.3 Add `#[cfg(test)]` to `fixture_documents_for_sources` in `commands.rs:982`
- [x] 5.4 Add `#[cfg(test)]` + `#[allow(dead_code)]` to `build_scope_from_node` in `commands.rs:1474`
- [x] 5.5 Add `#[cfg(test)]` + `#[allow(dead_code)]` to `build_space_scope` in `commands.rs:1488`
- [x] 5.6 Add `#[cfg(test)]` + `#[allow(dead_code)]` to `find_node_by_scope` in `commands.rs:1502`
- [x] 5.7 Add `#[cfg(test)]` + `#[allow(dead_code)]` to `collect_fixture_documents` in `commands.rs:1525`
- [x] 5.8 Add `#[cfg(test)]` + `#[allow(dead_code)]` to `should_retry_document` in `commands.rs:1778`

## 6. Verify

- [x] 6.1 Run `cargo check` and confirm zero warnings
