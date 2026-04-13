## Why

Synced Feishu tables (`sheet` / `bitable`) were written one directory level too high: `expected_output_path` joined only `sync_root` and folder segments, omitting the sanitized knowledge-base folder that Markdown sync and the desktop UI use. Users opening the table link in the browser therefore hit a path where the file does not exist.

## What Changes

- Align export-only (`sheet` / `bitable`) local output paths with the same directory rules as Markdown output (including the space folder and sanitized segments).
- Reuse the existing Markdown path builder and swap the file extension to the export type so leaf naming stays consistent.
- Update regression tests that encoded the old, incorrect path layout.

## Capabilities

### New Capabilities

### Modified Capabilities

- `mcp-markdown-content-pipeline`: Stable local file mapping for export-only tables must match Markdown-relative layout under the configured sync root, including the knowledge-base directory segment.

## Impact

- Affected code: `src-tauri/src/sync.rs`, `src-tauri/src/commands.rs` (tests only if expectations change).
- Affected behavior: on-disk location of `.xlsx` exports and manifest `output_path` values for new syncs; existing manifests may still point at old paths until re-synced.
- No API or dependency changes.
