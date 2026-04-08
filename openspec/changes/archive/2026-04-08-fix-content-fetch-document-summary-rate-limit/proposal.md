## Why

Some knowledge-base sync runs still fail during the content-fetch stage with `获取文档信息失败(code=99991400): request trigger frequency limit`. The discovery path already handles throttled document-summary lookups more gracefully, but the content pipeline still performs an unguarded document-summary request before block retrieval.

## What Changes

- Reuse the existing bounded Feishu throttle retry path when the content pipeline fetches a document's summary before loading its blocks.
- Keep non-throttling document-summary failures visible immediately so permission and payload problems still surface without extra delay.
- Add regression coverage for content-fetch-stage document-summary throttling.

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `mcp-markdown-content-pipeline`: Require the content-fetch pipeline to retry transient `99991400` document-summary throttling before marking the document as a content-fetch failure.

## Impact

- `src-tauri/src/mcp.rs` content-fetch entrypoint and related retry tests.
