## MODIFIED Requirements

### Requirement: Sync-Oriented Interaction Flow
The application MUST present synchronization as a primary workflow distinct from export/download actions, and MUST let users choose and review the effective knowledge base sync scope together with the mirrored local output destination before and after sync creation. The source-selection tree MUST reveal only one hierarchy level per expansion action, and MUST present non-directory node types, including Feishu Bitable items, with trustworthy non-folder affordances.

#### Scenario: Start sync from dedicated action
- **WHEN** a user enters the document assistant and selects knowledge base sources
- **THEN** the primary action presented is to start synchronization rather than export/download

#### Scenario: Select directory or document scope inside knowledge base
- **WHEN** a user configures a synchronization source from an accessible knowledge base
- **THEN** the UI allows choosing the whole knowledge base, a directory subtree, or an individual document as the sync scope

#### Scenario: Show scoped source context
- **WHEN** a user reviews sync configuration before execution
- **THEN** the UI displays the selected knowledge base scope and the effective local sync target that will receive synchronized Markdown output in the mirrored source structure

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
