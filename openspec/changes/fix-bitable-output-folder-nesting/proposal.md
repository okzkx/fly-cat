## Why

Export-only Feishu table items currently write their local `.xlsx` output under a directory that repeats the table title, producing a nested `.../<title>/<title>.xlsx` layout. This makes single-table sync results look like a folder containing a table instead of a direct table file and breaks the expected local mapping for task-planning tables.

## What Changes

- Update export-only output path construction so `bitable` and `sheet` files reuse only their parent knowledge-base path segments before appending the exported file name.
- Preserve stable manifest/output-path comparisons for export-only documents after the path rule changes.
- Add regression coverage for export-only output path generation to prevent reintroducing duplicate title folders.

## Capabilities

### New Capabilities

### Modified Capabilities
- `mcp-markdown-content-pipeline`: Export-only synced files must preserve source hierarchy without wrapping the exported file in an extra same-name directory.

## Impact

- Affected code: `src-tauri/src/sync.rs`, related backend tests.
- Affected behavior: local output layout for synced `bitable` / `sheet` exports and unchanged-path comparisons in manifest-based skip logic.
- No new dependencies or external API changes.
