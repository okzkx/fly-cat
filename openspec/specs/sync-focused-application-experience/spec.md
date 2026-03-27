# sync-focused-application-experience Specification

## Purpose
TBD - created by archiving change create-feishu-knowledge-base-sync-app. Update Purpose after archive.
## Requirements
### Requirement: Sync-Oriented Interaction Flow
The application MUST present synchronization as a primary workflow distinct from export/download actions, and MUST let users choose and review the effective knowledge base sync sources together with the mirrored local output destination before and after sync creation. The source-selection tree MUST reveal only one hierarchy level per expansion action, and MUST present non-directory node types, including Feishu Bitable items, with trustworthy non-folder affordances.

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
- **THEN** the task view shows whether the run targeted a whole knowledge base, a directory subtree, a single document, or a multi-document set, including the selected knowledge base and a trustworthy summary of the selected document count or paths when multiple documents were chosen

### Requirement: User-Facing Branding Consistency
The application MUST use consistent FlyCat / 飞猫助手 branding across user-visible page titles and task-oriented views, while preserving sync-specific wording where it describes workflow behavior rather than product identity.

#### Scenario: Primary pages use FlyCat branding
- **WHEN** a user visits major application pages such as settings, auth, home, or task views
- **THEN** the visible page-level application branding uses `飞猫助手` or `飞猫助手 / FlyCat` consistently instead of outdated `飞书同步...` product naming

#### Scenario: Task-related titles avoid outdated product branding
- **WHEN** the application shows task-oriented headings, empty states, or related user-facing labels
- **THEN** those labels remain workflow-descriptive without reintroducing outdated Feishu-sync product branding as the app identity

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

### Requirement: Configuration and Authentication Experience Parity
The application MUST provide configuration and authentication experiences that stay structurally aligned with the reference project, and MUST treat application configuration validity and signed-in user authorization validity as separate user-visible states.

#### Scenario: Settings page provides guided configuration
- **WHEN** the user opens application settings
- **THEN** the page presents guided Feishu/MCP configuration with explanatory help content in the same structured style as the reference settings page

#### Scenario: Auth page preserves dedicated authorization flow
- **WHEN** the user needs to authorize the application
- **THEN** the application presents a dedicated auth page with a reference-style user login flow, clear status feedback, fallback actions, and navigation back to settings

#### Scenario: Valid configuration still requires user sign-in
- **WHEN** Feishu application settings are valid but no signed-in user session is active
- **THEN** the application directs the user to the auth page instead of treating configuration as equivalent to authorization

#### Scenario: Expired session requires reauthorization
- **WHEN** the application detects that a previously signed-in user session has expired or can no longer be refreshed
- **THEN** the auth experience presents a reauthorization path instead of a generic connection validation failure

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

### Requirement: User Authorization State Guidance
The application MUST present user-authorization recovery states distinctly from generic transport or configuration failures.

#### Scenario: Signed-out guidance is actionable
- **WHEN** the user has not completed the required Feishu user login flow
- **THEN** the UI indicates that sign-in is required before knowledge bases can be loaded and provides a direct action to begin authorization

#### Scenario: Permission-denied guidance reflects user access
- **WHEN** the backend determines that the signed-in user lacks access to the requested knowledge base operations
- **THEN** the UI tells the user that the current account lacks permission and does not describe the state as only an application-configuration problem

#### Scenario: Reauthorization guidance is shown for expired session
- **WHEN** the backend classifies the current authorization state as expired or reauthorization-required
- **THEN** the UI shows a reauthorization-focused recovery message and retry entry point

