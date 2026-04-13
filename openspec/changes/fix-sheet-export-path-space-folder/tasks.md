## 1. Implementation

- [ ] 1.1 Change `expected_output_path` for `sheet` / `bitable` to reuse `markdown_output_path` and set the export extension
- [ ] 1.2 Adjust Rust unit tests that assert export-only paths

## 2. Validation

- [ ] 2.1 `cargo test -p feishu_docs_sync` (or workspace package name) for affected crates
- [ ] 2.2 `openspec validate --change "fix-sheet-export-path-space-folder"`
