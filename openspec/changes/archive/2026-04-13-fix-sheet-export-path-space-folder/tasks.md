## 1. Implementation

- [x] 1.1 Change `expected_output_path` for `sheet` / `bitable` to reuse `markdown_output_path` and set the export extension
- [x] 1.2 Adjust Rust unit tests that assert export-only paths

## 2. Validation

- [x] 2.1 `cargo test` in `src-tauri` for affected crate
- [x] 2.2 `openspec validate fix-sheet-export-path-space-folder --type change`
