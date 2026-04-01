## 1. Implementation

- [x] 1.1 Extend `prepare_force_repulled_documents_impl` to remove wiki child directory sibling to `.md` outputs; keep export-only paths unchanged.
- [x] 1.2 Add Rust unit test: parent `.md` + child dir with a file; after prep, child file gone and parent file gone.

## 2. Validation

- [x] 2.1 `cargo test --manifest-path src-tauri/Cargo.toml` (focused module or full).
- [x] 2.2 `npm run typecheck`.
- [x] 2.3 `openspec validate fix-force-repull-wiki-child-folder --type change`.
