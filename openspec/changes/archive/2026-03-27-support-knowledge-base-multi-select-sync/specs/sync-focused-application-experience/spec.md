## MODIFIED Requirements

### Requirement: Sync-Oriented Interaction Flow
The application MUST present synchronization as a primary workflow distinct from export/download actions, and MUST let users choose and review the effective knowledge base sync sources together with the mirrored local output destination before and after sync creation.

#### Scenario: Start sync from dedicated action
- **WHEN** a user enters the document assistant and selects knowledge base sources
- **THEN** the primary action presented is to start synchronization rather than export/download

#### Scenario: Select directory or document scope inside knowledge base
- **WHEN** a user configures a synchronization source from an accessible knowledge base
- **THEN** the UI allows choosing the whole knowledge base, a directory subtree, an individual document, or multiple document nodes from that same knowledge base

#### Scenario: One-click select parent document subtree
- **WHEN** a document node has descendant documents and the user wants to include that whole branch in the current multi-select set
- **THEN** the UI provides a one-click action that selects the parent document together with all descendant document nodes from that branch

#### Scenario: Show scoped source context
- **WHEN** a user reviews sync configuration before execution
- **THEN** the UI displays whether the selection is a whole knowledge base, a directory subtree, a single document, or a multi-document set, together with the effective local sync target that will receive synchronized Markdown output in the mirrored source structure

#### Scenario: Preserve reference home-page role
- **WHEN** the user reaches the primary workspace after authentication
- **THEN** the main page serves the same role as the reference project's home page, but its primary action is sync creation rather than export creation

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
- **THEN** the task view shows whether the run targeted a whole knowledge base, a directory subtree, a single document, or a multi-document set, including the selected knowledge base and a trustworthy summary of the selected document count or paths when multiple documents were chosen
