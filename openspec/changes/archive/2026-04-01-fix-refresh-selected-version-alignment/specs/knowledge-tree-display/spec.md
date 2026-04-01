## MODIFIED Requirements

### Requirement: Bulk remote freshness refresh

The system MUST provide a labeled control on the knowledge base home card (same surface as **批量删除** and **开始同步**) that refreshes remote document metadata for the **currently checked document/bitable leaves that already have sync status `synced`**. The implementation MUST use the same batch freshness API and persistence as the automatic debounced freshness pass for the selected synced document ids. The control MUST be disabled when sync cannot run (no usable sync root or connection state disallows sync, matching existing **开始同步** gating) or when there are zero checked synced leaves. While a refresh is in progress, the control MUST show a loading state and MUST NOT start overlapping refresh calls.

After the refresh completes, the system MUST align the local version metadata for each selected synced document with the refreshed remote version metadata when any of the following is true:

- the local version is lower than the remote version
- the local version is missing while the remote version exists
- the remote version is missing while the local version exists

This alignment MUST update the manifest-backed local version state used by the tree UI, but MUST NOT create a sync task or re-download document bodies.

#### Scenario: User refreshes checked synced documents

- **WHEN** the user activates the bulk freshness control and at least one checked leaf document has sync status `synced` and `canRunSync` is true
- **THEN** the system fetches remote freshness for the checked synced document ids, updates the in-memory freshness map, persists metadata, and updates manifest-backed local version state for the selected synced documents that need alignment

#### Scenario: No checked synced documents

- **WHEN** no checked leaf document has sync status `synced`
- **THEN** the bulk freshness control is disabled

#### Scenario: Sync unavailable

- **WHEN** the connection or sync root is not usable for sync (same conditions under which **开始同步** is disabled for connectivity/root reasons)
- **THEN** the bulk freshness control is disabled

#### Scenario: Refresh aligns local version label

- **GIVEN** a checked synced document whose local version label is lower than the refreshed remote version
- **WHEN** the user completes the bulk freshness action successfully
- **THEN** the tree updates to show matching local/remote version metadata for that document without starting a sync task

#### Scenario: Does not replace per-row re-sync

- **WHEN** the user uses the bulk freshness control
- **THEN** the system does not create a sync task or re-download document bodies (that remains the per-row re-sync control)
