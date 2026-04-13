## Context

`markdown_output_path` in `render.rs` builds `sync_root / <sanitized space name or id> / ...parent path segments / <sanitized leaf>.md`. Export-only path logic in `sync.rs` duplicated only the parent `path_segments` loop against `sync_root`, skipping the space segment and raw segment names.

## Approach

For `sheet` and `bitable`, derive the export path from `markdown_output_path(sync_root, source_document)` and replace the `.md` extension with the export extension (`xlsx` today). This keeps one source of truth for hierarchy and sanitization and guarantees parity with `mapDocumentPath` on the frontend.

## Risks

- Users who already synced tables to the wrong folder will have files at the old location; the next successful sync writes to the new path and manifest cleanup may remove the old file when `output_path` changes. Acceptable behavior.

## Testing

- Update `expected_output_path` unit test expectations.
- Run `cargo test` for the sync and commands modules.
