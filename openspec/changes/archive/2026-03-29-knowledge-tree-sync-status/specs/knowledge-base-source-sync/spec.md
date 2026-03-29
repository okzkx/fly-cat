# knowledge-base-source-sync

## ADDED Requirements

### Requirement: Provide document sync status mapping

The backend SHALL provide a `get_document_sync_statuses` command that returns a mapping of document IDs to their sync status. Each entry includes the sync result status ("synced" or "failed") and the last sync timestamp.

- **WHEN** the frontend calls `get_document_sync_statuses` with a `syncRoot` parameter
- **THEN** the backend reads the sync manifest from `syncRoot/.feishu-sync-manifest.json`
- **AND** returns a JSON object mapping each `document_id` to `{ status, lastSyncedAt }`
- **AND** records with `status: "success"` in the manifest are mapped to `status: "synced"`
- **AND** records with `status: "failed"` in the manifest are mapped to `status: "failed"`

#### Scenario: Manifest contains synced and failed documents
- **GIVEN** the manifest has records for "doc-1" (status: "success", lastSyncedAt: "2026-03-28T14:30:00+08:00") and "doc-2" (status: "failed", lastSyncedAt: "2026-03-28T15:00:00+08:00")
- **WHEN** `get_document_sync_statuses` is called
- **THEN** the result contains `"doc-1": { "status": "synced", "lastSyncedAt": "2026-03-28T14:30:00+08:00" }` and `"doc-2": { "status": "failed", "lastSyncedAt": "2026-03-28T15:00:00+08:00" }`

#### Scenario: No manifest file exists
- **GIVEN** no `.feishu-sync-manifest.json` file exists at the sync root
- **WHEN** `get_document_sync_statuses` is called
- **THEN** an empty object `{}` is returned
