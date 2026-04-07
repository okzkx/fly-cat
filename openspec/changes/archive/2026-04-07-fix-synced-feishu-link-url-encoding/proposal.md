## Why

Feishu sometimes returns absolute hyperlinks in `text_run` metadata as percent-encoded strings (for example `https%3A%2F%2Fexample.com%2Fpath%2F`). The sync pipeline previously copied those literals into Markdown `(...)` targets, so synced files contained broken-looking URLs that are not valid clickable `http`/`https` links.

## What Changes

- Normalize hyperlink targets when extracting rich text from Feishu blocks: if the value is percent-encoded but decodes to a standard `http://` or `https://` URL, emit the decoded form in generated Markdown.
- Add regression coverage for encoded absolute URLs in the MCP parsing layer.

## Capabilities

### New Capabilities

- (none; behavior is a correction under the existing Markdown pipeline)

### Modified Capabilities

- `mcp-markdown-content-pipeline`: Require that external link targets written into Markdown use decoded `http`/`https` URLs when Feishu supplies percent-encoded absolute links.

## Impact

- Affected code: `src-tauri/src/mcp.rs` (link extraction), existing Rust tests in the same module.
- No new dependencies (`urlencoding` is already used in the crate).
- User-visible: synced `.md` files show correct `https://...` link targets instead of `https%3A%2F%2F...`.
