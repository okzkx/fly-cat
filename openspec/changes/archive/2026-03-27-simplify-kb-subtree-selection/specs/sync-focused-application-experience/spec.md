## MODIFIED Requirements

### Requirement: Sync-Oriented Interaction Flow
The application MUST present synchronization as a primary workflow distinct from export/download actions, and MUST let users choose and review the effective knowledge base sync sources together with the mirrored local output destination before and after sync creation. The source-selection tree MUST reveal only one hierarchy level per expansion action, MUST present non-directory node types, including Feishu Bitable items, with trustworthy non-folder affordances, and MUST treat a selected parent document as covering its full descendant document subtree by default.

#### Scenario: Start sync from dedicated action
- **WHEN** a user enters the document assistant and selects knowledge base sources
- **THEN** the primary action presented is to start synchronization rather than export/download

#### Scenario: Select directory or document scope inside knowledge base
- **WHEN** a user configures a synchronization source from an accessible knowledge base
- **THEN** the UI allows choosing the whole knowledge base, a directory subtree, a single leaf document, or one or more document subtree roots from that same knowledge base

#### Scenario: Selecting parent document implies subtree coverage
- **WHEN** a user checks a document node that has descendant documents
- **THEN** the UI treats that node as selecting the full document subtree rooted at that document without requiring a separate subtree-selection button

#### Scenario: Descendant document is unavailable under selected ancestor
- **WHEN** a document subtree root is currently selected
- **THEN** descendant document nodes covered by that root render with unavailable checkboxes so the user cannot separately toggle redundant child selections inside that covered branch

#### Scenario: Show scoped source context
- **WHEN** a user reviews sync configuration before execution
- **THEN** the UI displays whether the selection is a whole knowledge base, a directory subtree, a single leaf document, a single document subtree, or a multi-subtree set from one knowledge base, together with the effective local sync target that will receive synchronized Markdown output in the mirrored source structure

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

### Requirement: Sync Lifecycle Status Visibility
The application MUST expose synchronization lifecycle states and progress at document and run levels, and MUST display trustworthy task timestamps, selected source context, and output-location context in task history.

#### Scenario: Show active sync progress
- **WHEN** a sync run is in progress
- **THEN** the UI displays current lifecycle state, processed count, and pending count

#### Scenario: Show completion summary
- **WHEN** a sync run completes
- **THEN** the UI displays counts of succeeded, skipped, and failed documents with quick access to failures

#### Scenario: Task list remains a dedicated page
- **WHEN** the user wants to inspect current or historical sync runs
- **THEN** the application shows a dedicated task-list style page rather than only inline status summaries on the home page

#### Scenario: Task timestamps are user-readable
- **WHEN** a task is listed in task history
- **THEN** the task creation or update time renders as a valid user-readable date/time rather than an invalid or debug-only timestamp string

#### Scenario: Task history shows output destination context
- **WHEN** a user inspects a sync task in the task list
- **THEN** the task view shows the resolved output directory for that task rather than only an ambiguous relative path string

#### Scenario: Task history shows selected source scope
- **WHEN** a user inspects a sync task in the task list
- **THEN** the task view shows whether the run targeted a whole knowledge base, a directory subtree, a single leaf document, a single document subtree, or multiple document subtrees from one knowledge base, including the selected knowledge base and a trustworthy summary of the selected root paths and effective document count
