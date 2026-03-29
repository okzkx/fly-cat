## ADDED Requirements

### Requirement: Synced Documents Default Checked in Knowledge Tree
The system SHALL display all successfully synced documents as checked by default in the knowledge base tree. The checked state MUST be derived from the document sync statuses obtained from the backend manifest. A synced document that is not in the user's explicit selection MUST still appear checked through automatic key merging.

#### Scenario: Synced document appears checked on tree load
- **WHEN** the knowledge base tree loads and a document has a sync status of "synced" in `documentSyncStatuses`
- **THEN** that document's tree node checkbox is in the checked state without any user interaction

#### Scenario: Newly synced document appears checked after task completion
- **WHEN** a sync task completes successfully and the document sync statuses are refreshed
- **THEN** newly synced documents automatically appear as checked in the tree

#### Scenario: Failed synced document does not appear checked by default
- **WHEN** a document has a sync status of "failed" in `documentSyncStatuses`
- **THEN** that document's tree node checkbox is not in the default checked state

### Requirement: User Can Uncheck Synced Documents
The system SHALL allow the user to uncheck a synced document's checkbox. The unchecked state MUST be tracked separately from the explicit user selection. The system MUST maintain a set of "unchecked synced document keys" to distinguish user-initiated unchecks from the default checked state.

#### Scenario: User unchecks a synced document
- **WHEN** the user clicks the checkbox of a synced document to uncheck it
- **THEN** the document is removed from the checked keys set and is not re-added by the default synced key merging logic

#### Scenario: User re-checks a previously unchecked synced document
- **WHEN** the user clicks the checkbox of a previously unchecked synced document to check it again
- **THEN** the document reappears as checked and is removed from the unchecked synced document tracking set

### Requirement: Auto-delete Unchecked Synced Documents on Sync Start
The system SHALL automatically delete all documents that are both (a) currently synced on disk and (b) not in the current checked keys set when the user clicks "Start Sync". The deletion MUST occur before creating the new sync task and MUST include removal of the document file, associated image assets, and manifest records. After deletion, the system MUST refresh document sync statuses to reflect the cleanup.

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
