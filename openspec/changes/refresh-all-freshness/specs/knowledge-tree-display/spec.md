## ADDED Requirements

### Requirement: Bulk remote freshness refresh

The system MUST provide a labeled control on the knowledge base home card (same surface as **批量删除** and **开始同步**) that refreshes remote document metadata for **all** documents currently in sync status `synced`. The implementation MUST use the same batch freshness API and persistence as the automatic debounced freshness pass (`checkDocumentFreshness` followed by `saveFreshnessMetadata` for the active sync root). The control MUST be disabled when sync cannot run (no usable sync root or connection state disallows sync, matching existing **开始同步** gating) or when there are zero synced documents. While a refresh is in progress, the control MUST show a loading state and MUST NOT start overlapping refresh calls.

#### Scenario: User refreshes all synced documents

- **WHEN** the user activates the bulk freshness control and at least one document has sync status `synced` and `canRunSync` is true
- **THEN** the system fetches remote freshness for all such document ids, updates the in-memory freshness map, persists metadata, and shows a success confirmation

#### Scenario: No synced documents

- **WHEN** no document has sync status `synced`
- **THEN** the bulk freshness control is disabled

#### Scenario: Sync unavailable

- **WHEN** the connection or sync root is not usable for sync (same conditions under which **开始同步** is disabled for connectivity/root reasons)
- **THEN** the bulk freshness control is disabled

#### Scenario: Does not replace per-row re-sync

- **WHEN** the user uses the bulk freshness control
- **THEN** the system does not create a sync task or re-download document bodies (that remains the per-row re-sync control)
