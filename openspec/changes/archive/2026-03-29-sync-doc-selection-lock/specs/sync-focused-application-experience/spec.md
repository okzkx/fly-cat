## ADDED Requirements

### Requirement: Checkbox Locking During Active Sync

The application MUST disable checkbox interaction for all currently checked source nodes once a sync task is created, and MUST re-enable them when the active sync task reaches a terminal state.

#### Scenario: Checkboxes locked after sync starts
- **WHEN** the user clicks "开始同步" and a sync task is successfully created
- **THEN** all currently checked source nodes (spaces, folders, documents) have their checkboxes disabled
- **AND** the user cannot uncheck those nodes while the task is active

#### Scenario: Unchecked nodes remain selectable
- **WHEN** a sync task is active and the user has not checked certain unsynced document nodes
- **THEN** those unchecked unsynced nodes remain selectable (checkboxes enabled)

#### Scenario: Checkboxes re-enabled after task completes
- **WHEN** the active sync task reaches "completed" status
- **THEN** all previously locked nodes have their checkboxes re-enabled

#### Scenario: Checkboxes re-enabled after task fails
- **WHEN** the active sync task reaches "partial-failed" or "paused" status
- **THEN** all previously locked nodes have their checkboxes re-enabled

#### Scenario: Already-downloaded nodes stay disabled
- **WHEN** a document has already been downloaded (present in downloadedDocumentIds)
- **THEN** its checkbox remains disabled regardless of sync task state
