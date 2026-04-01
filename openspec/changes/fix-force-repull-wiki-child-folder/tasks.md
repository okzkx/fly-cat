## 1. Implementation

- [ ] 1.1 Extend `prepare_force_repulled_documents_impl` to remove wiki child directory sibling to `.md` outputs; keep export-only paths unchanged.
- [ ] 1.2 Add Rust unit test: parent `.md` + child dir with a file; after prep, child file gone and parent file gone.

## 2. Validation

- [ ] 2.1 `cargo test --manifest-path src-tauri/Cargo.toml` (focused module or full).
- [ ] 2.2 `npm run typecheck`.
- [ ] 2.3 `openspec validate fix-force-repull-wiki-child-folder --type change`.
