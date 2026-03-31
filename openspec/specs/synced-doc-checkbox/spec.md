# synced-doc-checkbox Specification

## Purpose
Manages the checkbox state of synced documents in the knowledge base tree, including default checked state for synced documents, user-initiated unchecking, automatic deletion of unchecked synced documents on sync start, and checkbox disabling during active sync operations.
## Requirements
### Requirement: Synced Documents Default Checked in Knowledge Tree
The system SHALL display all successfully synced documents as checked by default in the knowledge base tree. The checked state MUST be derived from the document sync statuses obtained from the backend manifest. A synced document that is not in the user's explicit selection MUST still appear checked through automatic key merging.

The Tree component MUST use the default checkbox behavior (without `checkStrictly`), which automatically calculates and displays half-checked (indeterminate) states for parent nodes when some but not all of their children are checked.

#### Scenario: Synced document appears checked on tree load
- **WHEN** the knowledge base tree loads and a document has a sync status of "synced" in `documentSyncStatuses`
- **THEN** that document's tree node checkbox is in the checked state without any user interaction

#### Scenario: Newly synced document appears checked after task completion
- **WHEN** a sync task completes successfully and the document sync statuses are refreshed
- **THEN** newly synced documents automatically appear as checked in the tree

#### Scenario: Failed synced document does not appear checked by default
- **WHEN** a document has a sync status of "failed" in `documentSyncStatuses`
- **THEN** that document's tree node checkbox is not in the default checked state

#### Scenario: Parent node shows half-checked state when partial children are checked
- **WHEN** a folder node has some (but not all) of its descendant documents checked
- **THEN** the folder node's checkbox displays an indeterminate/half-checked state (minus sign)

#### Scenario: Parent node shows checked state when all children are checked
- **WHEN** a folder node has all of its descendant documents checked
- **THEN** the folder node's checkbox displays a fully checked state

#### Scenario: Parent node shows unchecked state when no children are checked
- **WHEN** a folder node has none of its descendant documents checked
- **THEN** the folder node's checkbox displays an unchecked state

### Requirement: User Can Uncheck Synced Documents
The system SHALL allow the user to uncheck a synced document's checkbox. The unchecked state MUST be tracked separately from the explicit user selection. The system MUST maintain a set of "unchecked synced document keys" to distinguish user-initiated unchecks from the default checked state.

#### Scenario: User unchecks a synced document
- **WHEN** the user clicks the checkbox of a synced document to uncheck it
- **THEN** the document is removed from the checked keys set and is not re-added by the default synced key merging logic

#### Scenario: User re-checks a previously unchecked synced document
- **WHEN** the user clicks the checkbox of a previously unchecked synced document to check it again
- **THEN** the document reappears as checked and is removed from the unchecked synced document tracking set

### Requirement: Auto-delete Unchecked Synced Documents on Sync Start
The system SHALL automatically delete all documents that are both (a) currently synced on disk and (b) not in the current checked keys set when the user clicks "Start Sync". The deletion MUST occur before creating the new sync task and MUST include removal of the document file, associated image assets, and manifest records. After deletion, the system MUST refresh document sync statuses to reflect the cleanup. If the user did not explicitly choose any sync sources and the action only performs cleanup of unchecked synced documents, the system MUST complete that cleanup without creating a follow-up sync task or issuing remote discovery requests.

#### Scenario: Unchecked synced document deleted on sync start
- **WHEN** the user clicks "Start Sync" with a synced document unchecked in the tree
- **THEN** the system calls `removeSyncedDocuments` for that document's ID, deleting the file and clearing its manifest record before creating the sync task

#### Scenario: All unchecked synced documents cleaned up
- **WHEN** the user clicks "Start Sync" with multiple synced documents unchecked
- **THEN** the system batch-deletes all unchecked synced documents in a single `removeSyncedDocuments` call before creating the sync task

#### Scenario: No deletion when all synced documents are checked
- **WHEN** the user clicks "Start Sync" and all synced documents remain checked
- **THEN** the system proceeds directly to creating the sync task without calling `removeSyncedDocuments`

#### Scenario: Sync statuses refreshed after cleanup
- **WHEN** the system finishes deleting unchecked synced documents
- **THEN** the system refreshes `documentSyncStatuses` so the tree no longer shows deleted documents as synced

#### Scenario: Cleanup-only action does not start discovery
- **WHEN** the user clicks "Start Sync" only to remove unchecked synced documents and has no explicit sync sources selected
- **THEN** the system completes the local cleanup and returns without creating a sync task or triggering remote discovery

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

#### Scenario: Cascading uncheck tracks synced documents for cleanup
- **WHEN** cascading uncheck causes synced documents to become unchecked
- **THEN** those synced document keys are added to `uncheckedSyncedDocKeys` so they will be deleted on sync start

#### Scenario: Cascading check removes from unchecked tracking
- **WHEN** cascading check causes previously unchecked synced documents to become checked
- **THEN** those document keys are removed from `uncheckedSyncedDocKeys`

### Requirement: Parent node half-checked state calculation
The system SHALL compute half-checked keys from the actual checked keys set. The `checkedKeys` prop MUST contain truly checked keys and computed half-checked keys, using `checkStrictly` mode to prevent Ant Design's default cascade behavior.

#### Scenario: Half-checked parent computed from children
- **WHEN** a folder node has some but not all descendant keys in the checked keys set
- **THEN** the folder node is rendered with an indeterminate (half-checked) visual state

### Requirement: Tri-state respects scope-only keys for covered descendants

When a node's `SyncScope` covers descendants (`space`, `folder`, or `document` with `includesDescendants`), the knowledge base tree MAY represent selection using only that node's key in the merged checked-key set (without listing every descendant key). For tri-state cycling on that node, the system SHALL treat this situation as **all checked** when every loaded descendant that is missing from the checked-key set has its checkbox disabled due to coverage by a selected ancestor. The system SHALL NOT treat it as mixed solely because descendant keys are omitted while the parent key is checked and descendants are covered-disabled.

#### Scenario: User unchecks after checking a folder that covers loaded children

- **WHEN** the user checks a folder whose descendants are present in the loaded tree and covered by the selection (descendant checkboxes disabled)
- **AND** the merged checked keys contain the folder key but not the individual descendant keys
- **THEN** the next checkbox or name-click toggle on that folder transitions to unchecked (and updates `selectedSources` / synced unchecked tracking consistently)

#### Scenario: True mixed descendants still use indeterminate path

- **WHEN** a parent node is checked and at least one loaded descendant remains interactive (checkbox not disabled) and is not in the checked-key set
- **THEN** the tri-state logic SHALL NOT force **all checked** solely from the parent key; the user MUST still be able to reach the indeterminate transition per the existing mixed-descendant rules

