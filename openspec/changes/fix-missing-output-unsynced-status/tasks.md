## 1. Backend status recalculation

- [ ] 1.1 Update `get_document_sync_statuses` so only manifest success rows with an existing local output file are reported as `synced`.
- [ ] 1.2 Add focused Rust regression coverage for existing-output vs missing-output status mapping.

## 2. Validate and land the change

- [ ] 2.1 Run targeted validation (`cargo test` for the affected backend tests and `openspec validate --change fix-missing-output-unsynced-status`) and confirm the change stays apply-ready.
- [ ] 2.2 Complete OpenCat workflow updates for this task (`TODO.md`, `DONE.md`, archive report, merge, cleanup).
