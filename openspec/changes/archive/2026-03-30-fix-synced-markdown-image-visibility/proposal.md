## Why

Synced Markdown documents can still lose images even after the earlier block-API migration. The current implementation only walks one level of Feishu child blocks and the OpenAPI image path does not persist auth-gated media as local assets, so generated Markdown can finish successfully while still showing no visible images.

## What Changes

- Recursively traverse descendant Feishu document blocks so nested image blocks are preserved in Markdown output order.
- Treat Feishu OpenAPI media references that require authenticated download as local-fallback assets instead of leaving them as unusable remote Markdown links.
- Store downloaded image assets with deterministic hashed filenames and stable extensions, then rewrite Markdown image links to the correct relative local asset path.
- Add targeted regression coverage for nested block traversal and local image asset rendering.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `mcp-markdown-content-pipeline`: Markdown generation must preserve image blocks that appear under nested descendant blocks instead of only direct root children.
- `sync-image-resolution-and-fallback`: Auth-gated Feishu image resources must fall back to local hashed assets with correct relative Markdown links.

## Impact

- Affected code: `src-tauri/src/mcp.rs`, `src-tauri/src/render.rs`, `src-tauri/src/sync.rs`
- Affected tests: Rust unit tests covering block traversal and image asset rendering
- Affected behavior: local synced Markdown image visibility for Feishu documents with nested or authenticated images
