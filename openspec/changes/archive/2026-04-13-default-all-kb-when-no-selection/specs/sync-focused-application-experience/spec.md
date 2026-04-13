## MODIFIED Requirements

### Requirement: Sync-Oriented Interaction Flow

The application MUST present synchronization as a primary workflow distinct from export/download actions, and MUST let users choose and review the effective knowledge base sync sources together with the mirrored local output destination before and after sync creation. The source-selection tree MUST reveal only one hierarchy level per expansion action, MUST present non-directory node types, including Feishu Bitable items, with trustworthy non-folder affordances, MUST treat a selected parent document as covering its full descendant syncable subtree by default, MUST allow directory nodes, document nodes, and bitable leaf nodes from the same knowledge base to be added to the explicit source set, MUST update checkbox state immediately from local selection state rather than waiting for remote subtree discovery, and MUST synchronize checkbox selection state and node highlight selection so that clicking a node name and clicking its checkbox produce the same checked-and-highlighted result.

#### Scenario: Start sync with no explicit checkbox selection defaults to all spaces

- **WHEN** the user has at least one accessible knowledge space and the explicit checkbox-selected source list is empty
- **THEN** the primary start-sync action MUST still be available and MUST create a sync task whose sources are equivalent to checking every knowledge space root as a whole-space scope (all spaces, all discoverable documents under each)

#### Scenario: Refresh-all freshness with no checked synced leaves defaults to all synced documents

- **WHEN** the user invokes the bulk "refresh all freshness" action and no synced document is currently selected via tree checkboxes
- **THEN** the application MUST run the same freshness alignment as if every locally known successfully synced document (excluding documents currently in-flight for an active sync task) were selected

#### Scenario: Destructive bulk actions still require explicit selection

- **WHEN** the user invokes force-repull or batch-delete synced documents from the home toolbar
- **THEN** the application MUST NOT infer a default "all documents" scope from an empty checkbox selection; these actions MUST keep requiring at least one explicitly checked synced target

#### Scenario: Start sync from dedicated action

- **WHEN** a user enters the document assistant and selects knowledge base sources
- **THEN** the primary action presented is to start synchronization rather than export/download

#### Scenario: Select directory or document scope inside knowledge base

- **WHEN** a user configures a synchronization source from an accessible knowledge base
- **THEN** the UI allows choosing the whole knowledge base, a directory subtree, a single leaf document, a single document subtree, or a mixed set of directory and document roots from that same knowledge base

#### Scenario: Select bitable leaf scope inside knowledge base

- **WHEN** a user configures a synchronization source from an accessible knowledge base
- **THEN** the UI also allows choosing a single bitable leaf node as an explicit sync root

#### Scenario: Selecting parent document implies subtree coverage

- **WHEN** a user checks a document node that has descendant documents
- **THEN** the UI treats that node as selecting the full document subtree rooted at that document without requiring a separate subtree-selection button

#### Scenario: Descendant node is unavailable under selected ancestor

- **WHEN** a directory subtree or document subtree root is currently selected
- **THEN** descendant directory, document, and bitable leaf nodes covered by that root render with unavailable checkboxes so the user cannot separately toggle redundant child selections inside that covered branch

#### Scenario: Checkbox feedback does not wait for subtree loading

- **WHEN** a user checks or unchecks a directory or document node in the source-selection tree
- **THEN** the checkbox state and effective selection summary update from local state immediately without waiting for the application to fetch descendant nodes from the backend

#### Scenario: Show scoped source context

- **WHEN** a user reviews sync configuration before execution
- **THEN** the UI displays whether the selection is a whole knowledge base, a directory subtree, a single leaf document, a single document subtree, or a mixed directory-and-document source set, together with the effective local sync target that will receive synchronized Markdown output in the mirrored source structure

#### Scenario: Preserve reference home-page role

- **WHEN** the user reaches the primary workspace after authentication
- **THEN** the main page serves the same role as the reference project's home page, but its primary action is sync creation rather than export creation

#### Scenario: Expanding a knowledge base shows only one level

- **WHEN** a user expands a knowledge base node in the source-selection tree
- **THEN** the UI renders only that knowledge base's immediate child nodes and does not render deeper descendants until their own parent nodes are expanded

#### Scenario: Expanding a parent document shows only one level

- **WHEN** a user expands a parent document or directory node in the source-selection tree
- **THEN** the UI renders only that parent node's immediate child nodes and does not render grandchildren until the corresponding child node is expanded

#### Scenario: Bitable item is not shown as a folder

- **WHEN** a Feishu Bitable item appears in the source-selection tree
- **THEN** the UI renders it as a non-directory leaf node without folder-style expansion affordances

#### Scenario: Clicking node name checks its checkbox

- **WHEN** a user clicks on a document or directory node's name (title text) in the source-selection tree
- **THEN** the node becomes both highlighted and checked, producing the same visual and state result as if the user had clicked the node's checkbox

#### Scenario: Clicking bitable node name checks its checkbox

- **WHEN** a user clicks on a bitable node's name (title text) in the source-selection tree
- **THEN** the node becomes both highlighted and checked, producing the same visual and state result as if the user had clicked the node's checkbox

#### Scenario: Clicking checkbox highlights the node

- **WHEN** a user checks a document or directory node's checkbox in the source-selection tree
- **THEN** the node becomes both checked and highlighted, producing the same visual and state result as if the user had clicked the node's name

#### Scenario: Clicking bitable checkbox highlights the node

- **WHEN** a user checks a bitable node's checkbox in the source-selection tree
- **THEN** the node becomes both checked and highlighted, producing the same visual and state result as if the user had clicked the node's name
