## 1. Rust Model

- [x] 1.1 Add `DocumentFreshnessResult` struct to `model.rs` with fields: `status` (String), `local_version` (String), `remote_version` (String), `local_update_time` (String), `remote_update_time` (String), `error` (Option<String>)
- [x] 1.2 Derive `Clone`, `Debug`, `Serialize`, `Deserialize` for `DocumentFreshnessResult` with `#[serde(rename_all = "camelCase")]`

## 2. Rust Backend Command

- [x] 2.1 Implement `check_document_freshness` async Tauri command in `commands.rs`: accept `document_ids: Vec<String>` and `sync_root: String`, require authenticated session via `authorized_config_for_session`, build `FeishuOpenApiClient`, load manifest, iterate document IDs calling `fetch_document_summary`, compare against manifest records, return `HashMap<String, DocumentFreshnessResult>`
- [x] 2.2 Handle individual document API failures gracefully: set status `"error"` with message for that document, continue processing remaining documents
- [x] 2.3 Return early with empty map when document_ids is empty
- [x] 2.4 Register `check_document_freshness` in `lib.rs` invoke_handler

## 3. TypeScript Types

- [x] 3.1 Add `DocumentFreshnessResult` interface to `types/sync.ts` with fields: `status`, `localVersion`, `remoteVersion`, `localUpdateTime`, `remoteUpdateTime`, `error?`

## 4. Verification

- [x] 4.1 Run `cargo check` and `cargo test` to confirm no regressions
- [x] 4.2 Verify `cargo build` succeeds
