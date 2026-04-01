# synced-doc-checkbox Specification

## Purpose
Manages knowledge-base tree checkbox selection for batch sync and batch delete: checkboxes are independent of manifest sync status (sync state is shown via tags), "Start Sync" only uses checked sources without deleting unchecked synced files, "批量删除" removes checked synced documents locally, with tri-state parent/child behavior and disabled checkboxes while items are syncing or pending.
## Requirements
### Requirement: Syncing and Pending Documents Disable Checkbox
The system MUST disable the checkbox for documents that are currently being synced (status "syncing") or waiting to be synced (status "pending") in an active sync task. The disable MUST prevent both checking and unchecking actions.

#### Scenario: Syncing document checkbox is disabled
- **WHEN** an active sync task has a document in "syncing" state
- **THEN** that document's tree node checkbox is disabled and cannot be toggled by the user

#### Scenario: Pending document checkbox is disabled
- **WHEN** an active sync task has a document in "pending" state
- **THEN** that document's tree node checkbox is disabled and cannot be toggled by the user

#### Scenario: Checkbox re-enabled after task completion
- **WHEN** the active sync task completes or fails and the document was not successfully synced
- **THEN** the document's checkbox becomes enabled again for user interaction

### Requirement: Cascading Parent-Child Checkbox Toggle with Tri-State Cycling

When a user clicks the checkbox of a parent node (folder or document with descendants), the system SHALL cycle through three visual states (checked, indeterminate/half-checked, unchecked) with the following cascading behavior.

#### State Transitions

**From UNCHECKED:**

- Transition to CHECKED: check self and all descendant nodes

**From CHECKED:**

- If ALL descendants are currently checked: transition to UNCHECKED (uncheck self and all descendants)
- If SOME descendants are NOT all checked: transition to INDETERMINATE (leave each descendant in its current state; do not change any descendant's check state)

**From INDETERMINATE:**

- Transition to CHECKED: check self and all descendant nodes

#### Simplified Two-State Optimization

When a parent node and ALL of its descendants are in the same state (all checked OR all unchecked), the system SHALL only toggle between checked and unchecked, skipping the indeterminate state entirely.

Parent-child display invariants SHALL hold per product rules: a fully checked parent node SHALL imply every loaded descendant checkbox is rendered checked; a fully unchecked parent SHALL imply all descendants are unchecked; an indeterminate (half-checked) parent SHALL imply descendants are neither all checked nor all unchecked. Descendant checkboxes SHALL NOT be disabled solely because an ancestor scope covers them in `selectedSources`.

#### Scenario: Checking a folder with no previously checked children

- **WHEN** a folder node is unchecked with all descendants unchecked, and the user clicks its checkbox
- **THEN** the folder and all descendant nodes become checked

#### Scenario: Unchecking a folder where all descendants were checked

- **WHEN** a folder node is checked with all descendants checked, and the user clicks its checkbox
- **THEN** the folder and all descendant nodes become unchecked

#### Scenario: Indeterminate state when mixed children

- **WHEN** a folder node is checked but some descendants are unchecked, and the user clicks its checkbox
- **THEN** the folder enters indeterminate state and each descendant retains its current checked/unchecked state unchanged

#### Scenario: Checking from indeterminate state

- **WHEN** a folder node is in indeterminate state and the user clicks its checkbox
- **THEN** the folder and all descendant nodes become checked

#### Scenario: Leaf document toggle unchanged

- **WHEN** a leaf document node (no descendants) checkbox is clicked
- **THEN** the document toggles between checked and unchecked as before

#### Scenario: Parent checked shows all loaded children checked

- **WHEN** a user selects a scope that covers descendants (space, folder, or document with `includesDescendants`) and those descendants are present in the loaded tree
- **THEN** every loaded descendant checkbox is rendered checked and enabled (unless disabled for syncing/pending), not grayed out as non-interactive

### Requirement: Parent node half-checked state calculation
The system SHALL compute half-checked keys from the actual checked keys set derived solely from `selectedSources`. The `checkedKeys` prop MUST contain truly checked keys and computed half-checked keys, using `checkStrictly` mode to prevent Ant Design's default cascade behavior.

#### Scenario: Half-checked parent computed from children
- **WHEN** a folder node has some but not all descendant keys in the checked keys set
- **THEN** the folder node is rendered with an indeterminate (half-checked) visual state

### Requirement: Checkbox Selection Independent of Sync Status
The system SHALL NOT merge document sync status from the manifest into the tree checkbox checked-key set. All checkboxes SHALL default to unchecked until the user checks nodes via the existing selection / tri-state interaction. Document sync state (synced, failed, pending, syncing, not synced) SHALL be communicated only through non-checkbox UI such as tags and indicators next to each node.

The Tree component MUST continue to use `checkStrictly` with application-computed `halfChecked` keys for indeterminate parents.

#### Scenario: Synced document loads with checkbox unchecked
- **WHEN** the knowledge base tree loads and a document has sync status "synced" in `documentSyncStatuses`
- **THEN** that document's checkbox is unchecked unless the user has included it in `selectedSources`

#### Scenario: After sync task completes, new synced docs do not auto-check
- **WHEN** a sync task completes successfully and `documentSyncStatuses` is refreshed
- **THEN** newly synced documents remain unchecked in the tree unless the user had already selected those scopes

### Requirement: Start Sync Uses Only Checked Selection
When the user clicks "Start Sync", the system SHALL create a sync task from the current effective selected sources only. The system SHALL NOT delete local synced documents merely because they are unchecked before task creation.

#### Scenario: No removeSyncedDocuments on start sync for unchecked synced docs
- **WHEN** the user clicks "Start Sync" and some synced documents remain unchecked
- **THEN** the system does not call `removeSyncedDocuments` for those documents as part of this action

#### Scenario: Start sync still requires a non-empty selection
- **WHEN** the user has no selected sync sources
- **THEN** the system does not create a sync task (existing empty-selection behavior preserved)

### Requirement: Batch Delete Checked Synced Documents
The system SHALL provide a dedicated control (e.g. "批量删除") that deletes from disk every document that is both (a) within the current checked selection scope (resolved to leaf document IDs) and (b) currently in "synced" status in `documentSyncStatuses`, excluding documents that are "syncing" or "pending" in the active task. Deletion MUST use `removeSyncedDocuments` and MUST be followed by refreshing `documentSyncStatuses`.

#### Scenario: Batch delete removes checked synced documents
- **WHEN** the user checks one or more nodes that include synced documents and triggers batch delete
- **THEN** the system calls `removeSyncedDocuments` for those synced document IDs and refreshes statuses so tags show unsynced where applicable

#### Scenario: Batch delete disabled with no eligible documents
- **WHEN** no checked subtree contains a synced document ID eligible for deletion
- **THEN** the batch delete control is disabled

