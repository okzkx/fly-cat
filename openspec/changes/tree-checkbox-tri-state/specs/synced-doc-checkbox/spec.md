## MODIFIED Requirements

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
