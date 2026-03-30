## MODIFIED Requirements

### Requirement: Sync-Oriented Interaction Flow

The application MUST present synchronization as a primary workflow distinct from export/download actions, and MUST let users choose and review the effective knowledge base sync sources together with the mirrored local output destination before and after sync creation. The source-selection tree MUST reveal only one hierarchy level per expansion action, MUST present non-directory node types, including Feishu Bitable items, with trustworthy non-folder affordances, MUST treat a selected parent document as covering its full descendant syncable subtree by default, MUST allow directory nodes, document nodes, and bitable leaf nodes from the same knowledge base to be added to the explicit source set, MUST update checkbox state immediately from local selection state rather than waiting for remote subtree discovery, and MUST synchronize checkbox selection state and node highlight selection so that clicking a node name and clicking its checkbox produce the same checked-and-highlighted result.

#### Scenario: Select bitable leaf scope inside knowledge base
- **WHEN** a user configures a synchronization source from an accessible knowledge base
- **THEN** the UI allows choosing a single bitable leaf node as an explicit sync root in addition to whole-space, directory, and document scopes

#### Scenario: Descendant bitable becomes unavailable under selected ancestor
- **WHEN** a directory subtree or document subtree root is currently selected
- **THEN** descendant document and bitable leaf nodes covered by that root render with unavailable checkboxes so the user cannot separately toggle redundant child selections inside that covered branch

#### Scenario: Clicking bitable node name checks its checkbox
- **WHEN** a user clicks on a bitable node's name (title text) in the source-selection tree
- **THEN** the node becomes both highlighted and checked, producing the same visual and state result as if the user had clicked the node's checkbox

#### Scenario: Clicking bitable checkbox highlights the node
- **WHEN** a user checks a bitable node's checkbox in the source-selection tree
- **THEN** the node becomes both checked and highlighted, producing the same visual and state result as if the user had clicked the node's name

### Requirement: Checkbox Locking During Active Sync

The application MUST disable checkbox interaction for all currently checked source nodes once a sync task is created, and MUST re-enable them when the active sync task reaches a terminal state.

#### Scenario: Checkboxes locked after sync starts
- **WHEN** the user clicks "开始同步" and a sync task is successfully created
- **THEN** all currently checked source nodes (spaces, folders, documents, bitables) have their checkboxes disabled
- **AND** the user cannot uncheck those nodes while the task is active
