## Why

Synced Markdown documents can still lose images even when the document contains image blocks in Feishu. The current Rust block parser only recognizes `block_type` `28` as an image, while the active Feishu MCP and live block payloads use `block_type` `27`. As a result, image blocks are skipped during Markdown generation and the manifest records no local image assets.

## What Changes

- Update the Rust Feishu block parser to recognize image blocks returned as `block_type` `27`.
- Keep compatibility with the existing `28` handling so previously assumed payloads do not regress.
- Add targeted regression tests covering the current Feishu image block type and nested block flattening.

## Capabilities

### Modified Capabilities

- `mcp-markdown-content-pipeline`: image blocks returned by the active Feishu block API must be preserved instead of being dropped during parsing.

## Impact

- Affected code: `src-tauri/src/mcp.rs`
- Affected tests: Rust unit tests for block parsing and nested block traversal
- Affected behavior: synced Markdown documents retain image syntax and image assets when Feishu returns image blocks as type `27`
