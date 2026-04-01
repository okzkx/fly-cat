## MODIFIED Requirements

### Requirement: Checkbox Locking During Active Sync

The application MUST disable checkbox interaction for source nodes covered by the active sync task's selection lock, and MUST re-enable all nodes that remain locked when the active sync task reaches a terminal state. While a sync task is `pending` or `syncing`, document and bitable leaf nodes whose per-document sync status for the current sync root is `synced` MUST have their checkboxes enabled so the user may change selection without waiting for the entire task to finish. Space and folder nodes that are locked as part of the task scope MUST remain disabled until the active sync task reaches a terminal state.

#### Scenario: Checkboxes locked after sync starts
- **WHEN** the user clicks "开始同步" and a sync task is successfully created
- **THEN** document and bitable nodes in the task scope that are not yet successfully synced for this run have their checkboxes disabled
- **AND** space and folder nodes in the locked task scope have their checkboxes disabled

#### Scenario: Successful document unlocks during active task
- **WHEN** a sync task is still `pending` or `syncing`
- **AND** a document or bitable node in the task scope has per-document sync status `synced`
- **THEN** that node's checkbox is enabled

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
