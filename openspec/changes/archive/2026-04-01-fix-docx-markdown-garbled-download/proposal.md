## Why

Some synced `.md` files are currently perceived as "garbled downloads" because the app writes exported binary `docx` payloads into Markdown output paths. This breaks the expected Markdown workflow and makes affected files unreadable in text editors even when the local filename and directory path are correct.

## What Changes

- Stop using the export-task fast path for normal document (`doc`/`docx`) syncs that are expected to produce Markdown output.
- Keep export-task downloads only for export-only object types such as `sheet` and `bitable`.
- Add focused validation so Markdown documents are written as text while export-only items still download to their native file formats.

## Capabilities

### New Capabilities
- `fix-docx-markdown-garbled-download`: Ensure Markdown-targeted document sync never writes exported binary content into `.md` output paths.

### Modified Capabilities
- `mcp-markdown-content-pipeline`: Clarify that Markdown output must come from the structured content rendering pipeline, not from export-task binaries.
- `knowledge-base-source-sync`: Clarify that only export-only object types use export downloads during sync execution.

## Impact

- Affected code: `src-tauri/src/commands.rs`, `src-tauri/src/sync.rs`, related Rust tests.
- Affected behavior: document sync path selection between export-task download and Markdown rendering.
- No new dependencies or external API changes.
