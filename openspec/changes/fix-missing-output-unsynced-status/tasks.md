## 1. Backend status recalculation

- [x] 1.1 Update `get_document_sync_statuses` so only manifest success rows with an existing local output file are reported as `synced`.
- [x] 1.2 Add focused Rust regression coverage for existing-output vs missing-output status mapping.

## 2. Validation

- [x] 2.1 Run `cargo test --manifest-path "src-tauri/Cargo.toml"` and confirm the backend suite passes with the new regression coverage.
- [x] 2.2 Run `openspec validate --changes "fix-missing-output-unsynced-status"` and confirm the change remains archive-ready.
