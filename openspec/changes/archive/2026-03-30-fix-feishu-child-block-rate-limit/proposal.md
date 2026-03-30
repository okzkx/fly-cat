## Why

Some image-heavy Feishu documents fail during content retrieval because repeated child-block requests hit Feishu's frequency limit (`code=99991400`). This leaves otherwise syncable documents unsynced and makes image support unreliable for larger block trees.

## What Changes

- Add rate-limit-aware retry handling when fetching Feishu child blocks during document content traversal.
- Keep block traversal progressing after transient frequency-limit responses instead of failing the whole document immediately.
- Surface content-fetch failures only after the retry budget is exhausted so retryable throttling is handled automatically.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `mcp-markdown-content-pipeline`: Child block traversal must tolerate transient Feishu frequency limits while preserving successful Markdown sync for image-rich documents.

## Impact

- Feishu block-fetch traversal in the Rust sync pipeline
- Error handling and retry timing for content-fetch stage failures
- Validation coverage for throttled child-block retrieval
