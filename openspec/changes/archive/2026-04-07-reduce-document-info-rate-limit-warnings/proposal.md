## Why

During knowledge-base sync and discovery, Feishu OpenAPI frequently returns frequency-limit (`99991400`) responses for document metadata and block fetches. The shared retry helper logs every intermediate attempt as `[warn]`, which floods the developer console and reads like repeated failures even though retries are expected and usually succeed.

## What Changes

- Stop emitting a `[warn]` line for each in-progress throttle retry in the shared Feishu retry helper.
- Preserve bounded retries, backoff, and a clear warning only when the retry budget is exhausted (or equivalent final failure path).

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `tauri-desktop-runtime-and-backend`: Clarify that expected Feishu throttling during internal retries must not spam console warnings per attempt; exhaustion remains visible.

## Impact

- `src-tauri/src/mcp.rs` (`retry_feishu_rate_limited_request` and callers such as document summary / block fetch with retry).
