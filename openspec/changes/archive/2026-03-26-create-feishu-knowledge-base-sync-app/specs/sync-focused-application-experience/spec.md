## ADDED Requirements

### Requirement: Sync-Oriented Interaction Flow
The application MUST present synchronization as a primary workflow distinct from export/download actions.

#### Scenario: Start sync from dedicated action
- **WHEN** a user enters the document assistant and selects knowledge base sources
- **THEN** the primary action presented is to start synchronization rather than export/download

#### Scenario: Show scoped source context
- **WHEN** a user reviews sync configuration before execution
- **THEN** the UI displays selected knowledge base scopes and intended local sync target

#### Scenario: Preserve reference home-page role
- **WHEN** the user reaches the primary workspace after authentication
- **THEN** the main page serves the same role as the reference project's home page, but its primary action is sync creation rather than export creation

### Requirement: Sync Lifecycle Status Visibility
The application MUST expose synchronization lifecycle states and progress at document and run levels.

#### Scenario: Show active sync progress
- **WHEN** a sync run is in progress
- **THEN** the UI displays current lifecycle state, processed count, and pending count

#### Scenario: Show completion summary
- **WHEN** a sync run completes
- **THEN** the UI displays counts of succeeded, skipped, and failed documents with quick access to failures

#### Scenario: Task list remains a dedicated page
- **WHEN** the user wants to inspect current or historical sync runs
- **THEN** the application shows a dedicated task-list style page rather than only inline status summaries on the home page

### Requirement: Error Transparency and Retry Guidance
The application MUST provide actionable error feedback and retry entry points for failed sync items.

#### Scenario: Present failure reason
- **WHEN** a document fails during synchronization
- **THEN** the UI shows an error category and concise diagnostic message for that document

#### Scenario: Retry failed subset
- **WHEN** a completed run contains failed documents
- **THEN** the user can trigger a retry workflow for failed items without rerunning successful no-op items

### Requirement: Configuration and Authentication Experience Parity
The application MUST provide configuration and authentication experiences that stay structurally aligned with the reference project.

#### Scenario: Settings page provides guided configuration
- **WHEN** the user opens application settings
- **THEN** the page presents guided Feishu/MCP configuration with explanatory help content in the same structured style as the reference settings page

#### Scenario: Auth page preserves dedicated authorization flow
- **WHEN** the user needs to authorize the application
- **THEN** the application presents a dedicated auth page with clear status feedback, fallback actions, and navigation back to settings
