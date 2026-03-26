# sync-focused-application-experience Specification

## Purpose
TBD - created by archiving change create-feishu-knowledge-base-sync-app. Update Purpose after archive.
## Requirements
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

### Requirement: Connection Validation Shows Actionable Discovery Outcomes
The application MUST present connection validation results using user-actionable outcome categories instead of a single generic failure message.

#### Scenario: Show no-space guidance
- **WHEN** the backend classifies knowledge space loading as `connected-no-spaces`
- **THEN** the UI informs the user that the app is connected but has not been added to any knowledge space and provides guidance to join or authorize a space

#### Scenario: Show permission guidance
- **WHEN** the backend classifies knowledge space loading as `permission-denied`
- **THEN** the UI informs the user that the connection exists but required wiki read access is missing and does not label the state as a generic connection validation failure

#### Scenario: Show request failure guidance
- **WHEN** the backend classifies knowledge space loading as `request-failed` or `unexpected-response`
- **THEN** the UI shows a load failure state with retry entry points and concise diagnostics instead of presenting an empty knowledge space list

### Requirement: Empty Knowledge Space Lists Must Be Trustworthy
The application MUST only present a normal empty knowledge space state when backend discovery completed successfully.

#### Scenario: Empty list from successful discovery
- **WHEN** the backend returns a successful knowledge space discovery result with zero spaces
- **THEN** the UI renders the empty knowledge space state as a valid but actionable configuration outcome

#### Scenario: Empty list from failed discovery
- **WHEN** the backend fails to load knowledge spaces and no authoritative successful discovery result exists
- **THEN** the UI renders an error state rather than an empty knowledge space list

