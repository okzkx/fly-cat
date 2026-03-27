## MODIFIED Requirements

### Requirement: Sync-Oriented Interaction Flow
The application MUST present synchronization as a primary workflow distinct from export/download actions, and MUST show the effective local sync destination clearly before and after sync creation.

#### Scenario: Start sync from dedicated action
- **WHEN** a user enters the document assistant and selects knowledge base sources
- **THEN** the primary action presented is to start synchronization rather than export/download

#### Scenario: Show scoped source context
- **WHEN** a user reviews sync configuration before execution
- **THEN** the UI displays selected knowledge base scopes and the effective local sync target that will receive synchronized Markdown output

#### Scenario: Preserve reference home-page role
- **WHEN** the user reaches the primary workspace after authentication
- **THEN** the main page serves the same role as the reference project's home page, but its primary action is sync creation rather than export creation

### Requirement: Sync Lifecycle Status Visibility
The application MUST expose synchronization lifecycle states and progress at document and run levels, and MUST display trustworthy task timestamps and output-location context in task history.

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

### Requirement: Error Transparency and Retry Guidance
The application MUST provide actionable error feedback and retry entry points for failed sync items, including concise stage-aware diagnostics when failures occur repeatedly.

#### Scenario: Present failure reason
- **WHEN** a document fails during synchronization
- **THEN** the UI shows an error category and concise diagnostic message for that document

#### Scenario: Retry failed subset
- **WHEN** a completed run contains failed documents
- **THEN** the user can trigger a retry workflow for failed items without rerunning successful no-op items

#### Scenario: Repeated run failure shows stage-aware guidance
- **WHEN** all or most documents in a sync run fail during the same pipeline stage
- **THEN** the UI surfaces a run-level diagnostic that indicates whether the failure came from authorization, discovery, remote content retrieval, rendering, image handling, or filesystem write behavior
