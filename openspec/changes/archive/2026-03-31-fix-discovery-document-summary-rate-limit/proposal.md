## Why

Starting a sync from checked knowledge-base sources can still fail during discovery when Feishu's document info endpoint returns `code=99991400` (`request trigger frequency limit`). The current discovery path treats that response as a hard failure even though the same throttling is already handled more gracefully in other Feishu content-fetch paths.

## What Changes

- Add rate-limit retry behavior around Feishu document summary requests used during sync-task discovery.
- Preserve the current failure behavior for non-throttling document info errors so permission and data issues still surface immediately.
- Add regression coverage for discovery-stage document info throttling so checked knowledge-base sync can complete after transient Feishu limits.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `knowledge-base-source-sync`: discovery-stage document info lookups should tolerate transient Feishu rate limiting instead of failing the whole sync task immediately.

## Impact

- Affected code: `src-tauri/src/mcp.rs`, `src-tauri/src/commands.rs` discovery path tests, and related sync regression coverage.
- Affected systems: Feishu OpenAPI document discovery during sync-task creation.
