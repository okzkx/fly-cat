## 1. Backend strip + unchanged predicate

- [ ] 1.1 Add `prepare_force_repulled_documents` (delete outputs + image assets, keep manifest rows, clear version fields) and register the Tauri command.
- [ ] 1.2 Extend `is_document_unchanged` to require the manifest `output_path` file to exist; fix or add focused Rust tests.

## 2. Frontend wiring

- [ ] 2.1 Expose the new invoke from `tauriRuntime` / `taskManager`.
- [ ] 2.2 Extend `HomePage` force path: strip → freshness → forced align → reload statuses → start sync via new `App` callback when allowed; disable **强制更新** while a task is pending/syncing; warn when selection is empty.
- [ ] 2.3 Run `npm run typecheck`, `cargo test` for affected crates, and `openspec validate --change fix-force-update-repull`.

## 3. Spec sync

- [ ] 3.1 Merge the delta into `openspec/specs/knowledge-tree-display/spec.md` before archive.
