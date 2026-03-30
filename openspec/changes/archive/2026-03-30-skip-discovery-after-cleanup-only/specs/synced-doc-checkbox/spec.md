## MODIFIED Requirements

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
