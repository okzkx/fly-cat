## MODIFIED Requirements

### Requirement: Bulk remote freshness refresh

The system MUST provide labeled controls on the knowledge base home card (same surface as **批量删除** and **开始同步**) for the **currently checked document/bitable leaves that already have sync status `synced`**:

- **全部刷新** refreshes remote document metadata for the checked synced leaves and keeps the existing conditional local-version alignment rule.
- **强制更新** refreshes remote document metadata for the checked synced leaves and always aligns local version metadata to the refreshed remote metadata.

Both controls MUST use the same batch freshness API and persistence flow as the automatic debounced freshness pass for the selected synced document ids. Both controls MUST be disabled when sync cannot run (no usable sync root or connection state disallows sync, matching existing **开始同步** gating) or when there are zero checked synced leaves. While either action is in progress, the triggering control MUST show a loading state and MUST NOT start overlapping refresh calls.

After **全部刷新** completes, the system MUST align the local version metadata for each selected synced document with the refreshed remote version metadata only when any of the following is true:

- the local version is lower than the remote version
- the local version is missing while the remote version exists
- the remote version is missing while the local version exists

After **强制更新** completes, the system MUST align the local version metadata for each selected synced document with the refreshed remote version metadata whenever the refresh succeeds, regardless of whether the local version is lower, higher, missing, or simply different. This alignment MUST update the manifest-backed local version state used by the tree UI, but MUST NOT create a sync task or re-download document bodies.

#### Scenario: User refreshes checked synced documents

- **WHEN** the user activates **全部刷新** and at least one checked leaf document has sync status `synced` and `canRunSync` is true
- **THEN** the system fetches remote freshness for the checked synced document ids, updates the in-memory freshness map, persists metadata, and updates manifest-backed local version state only for the selected synced documents that satisfy the normal alignment rule

#### Scenario: Force update overwrites higher local version

- **GIVEN** a checked synced document whose local version label is higher than the refreshed remote version
- **WHEN** the user completes the **强制更新** action successfully
- **THEN** the tree updates to show local and remote version metadata that both match the refreshed remote version without starting a sync task

#### Scenario: No checked synced documents

- **WHEN** no checked leaf document has sync status `synced`
- **THEN** both **全部刷新** and **强制更新** are disabled

#### Scenario: Sync unavailable

- **WHEN** the connection or sync root is not usable for sync (same conditions under which **开始同步** is disabled for connectivity/root reasons)
- **THEN** both **全部刷新** and **强制更新** are disabled

#### Scenario: Does not replace per-row re-sync

- **WHEN** the user uses either bulk metadata control
- **THEN** the system does not create a sync task or re-download document bodies (that remains the per-row re-sync control)
