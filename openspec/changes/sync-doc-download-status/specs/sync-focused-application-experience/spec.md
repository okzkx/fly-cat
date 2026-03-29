## MODIFIED Requirements

### Requirement: Sync Lifecycle Status Visibility
The application MUST expose synchronization lifecycle states and progress at document and tree-node level. When a sync task is active, individual document nodes within the task's discovered scope MUST display "同步中" status regardless of whether the original selection was a leaf document, a directory subtree, or a whole space.

#### Scenario: Folder-level selection shows syncing status on descendant documents
- **WHEN** a sync task is active with a folder-level or space-level source selection
- **THEN** each discovered document node under that selection displays a "同步中" status tag in the knowledge tree
- **AND** the status transitions from "未同步" to "同步中" immediately when the task becomes active

#### Scenario: Pending task also shows syncing status
- **WHEN** a sync task is in "pending" status (created but not yet started)
- **THEN** all discovered document nodes under the task's scope display "同步中" status in the knowledge tree

#### Scenario: Individual document selection unchanged
- **WHEN** a sync task is active with individual document-level source selections
- **THEN** the behavior is unchanged — each selected document shows "同步中" status

### Requirement: SyncTask stores discovered document IDs

The `SyncTask` interface MUST include a `discoveredDocumentIds` field that lists all individual document IDs resolved from the task's source selections at task creation time. This enables the frontend to determine per-document syncing status without re-expanding folder/space scopes.

#### Scenario: Folder selection resolves to document IDs
- **WHEN** a sync task is created with a folder-level source selection
- **THEN** the task's `discoveredDocumentIds` contains all document IDs discovered under that folder

#### Scenario: Space selection resolves to document IDs
- **WHEN** a sync task is created with a space-level source selection
- **THEN** the task's `discoveredDocumentIds` contains all document IDs discovered under that space

#### Scenario: Single document selection preserves its ID
- **WHEN** a sync task is created with an individual document selection
- **THEN** the task's `discoveredDocumentIds` contains that document's ID
