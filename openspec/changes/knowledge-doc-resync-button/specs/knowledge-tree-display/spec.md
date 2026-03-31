## ADDED Requirements

### Requirement: Per-document re-sync control

The system MUST show a refresh-style control on each knowledge-tree row whose node kind is `document` or `bitable`, adjacent to other per-row actions (such as open-in-browser). The control MUST trigger re-synchronization for that row’s effective `SyncScope` only (after normalizing selection the same way as checkbox-driven sources). The control MUST be disabled when the configured sync output root is unavailable, when the connection is not usable for sync, or while that row’s document is already part of an active sync task’s in-progress set. When the row’s scope includes a `documentId` and the runtime supports manifest cleanup, the system MUST remove existing synced content for that document id before creating the new sync task, then refresh per-document sync status metadata in the UI.

#### Scenario: User re-syncs a document row

- **WHEN** the user activates the re-sync control on a document node and sync root is configured and the connection is usable
- **THEN** the system removes any prior synced record for that document id when present, creates a sync task whose selected sources are the normalized scope for that node only, starts the task, and updates displayed sync statuses

#### Scenario: Control hidden for non-leaf syncable types

- **WHEN** the node kind is space or folder
- **THEN** the re-sync control is not shown (folder/space bulk re-sync remains out of scope for this control)

#### Scenario: Control disabled during active sync of that document

- **WHEN** a sync task is active and the row’s document id is in the task’s current syncing/discovered set
- **THEN** the re-sync control is disabled

#### Scenario: Unusable connection

- **WHEN** the connection validation state does not allow sync operations
- **THEN** the re-sync control is disabled
