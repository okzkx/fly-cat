## Why

Starting a sync from a large checked knowledge-base scope can still stall in discovery with `获取文档信息失败(code=99991400): request trigger frequency limit`. The backend already walks the wiki tree sequentially, but it still performs an extra document-summary request for nearly every discovered document even though the wiki node list already provides the title, version, and update time needed to build the sync queue.

## What Changes

- Reuse wiki child-node metadata to build discovery queue entries for documents when that metadata already contains the fields needed for incremental sync planning.
- Fall back to the existing document-summary lookup only when wiki node metadata is incomplete, preserving the current retry protection for throttled fallback requests.
- Add regression coverage for the metadata reuse and fallback decision so discovery no longer bursts document-info requests unnecessarily.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `knowledge-base-source-sync`: discovery should avoid per-document summary lookups when authoritative wiki node metadata is already available for queue construction.

## Impact

- Affected code: `src-tauri/src/commands.rs` discovery queue construction and related backend tests.
- Affected systems: Feishu OpenAPI discovery during sync-task creation for scoped knowledge-base sync.
