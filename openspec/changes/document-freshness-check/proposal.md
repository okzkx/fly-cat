## Why

The sync pipeline already skips unchanged documents internally during `spawn_sync_progress`, but the user cannot see which documents have remote updates before clicking "Start Sync." A dedicated freshness-check command lets the frontend display update status (up-to-date, changed, not-yet-synced) on individual documents in the knowledge base tree, enabling informed sync decisions and reducing unnecessary full-sync runs.

## What Changes

- Add a new Tauri command `check_document_freshness` that accepts a list of document IDs and a sync root, fetches each document's latest `version` and `update_time` from the Feishu OpenAPI, compares against the local manifest, and returns a per-document freshness result (`current`, `updated`, `new`).
- Add corresponding TypeScript types and a thin frontend service wrapper so the UI can consume the freshness results.
- The existing internal skip logic (`is_document_unchanged` in `spawn_sync_progress`) remains unchanged; the new command is an additional explicit query surface.

## Capabilities

### New Capabilities
- `document-freshness-check`: Batch freshness query that compares remote Feishu document metadata against the local sync manifest to determine per-document update status

### Modified Capabilities

## Impact

- **Rust backend** (`commands.rs`): New `#[tauri::command]` function; reuses existing `FeishuOpenApiClient.fetch_document_summary` and `load_manifest`.
- **Model** (`model.rs`): New `DocumentFreshnessResult` struct added to the model layer.
- **TypeScript types** (`types/sync.ts`): New `DocumentFreshnessResult` interface.
- **No breaking changes**: Existing commands, manifest format, and sync pipeline remain untouched.
