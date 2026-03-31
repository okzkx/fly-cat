# sync-focused-application-experience Specification

## Purpose
TBD - created by archiving change create-feishu-knowledge-base-sync-app. Update Purpose after archive.
## Requirements
### Requirement: Sync-Oriented Interaction Flow
The application MUST present synchronization as a primary workflow distinct from export/download actions, and MUST let users choose and review the effective knowledge base sync sources together with the mirrored local output destination before and after sync creation. The source-selection tree MUST reveal only one hierarchy level per expansion action, MUST present non-directory node types, including Feishu Bitable items, with trustworthy non-folder affordances, MUST treat a selected parent document as covering its full descendant syncable subtree by default, MUST allow directory nodes, document nodes, and bitable leaf nodes from the same knowledge base to be added to the explicit source set, MUST update checkbox state immediately from local selection state rather than waiting for remote subtree discovery, and MUST synchronize checkbox selection state and node highlight selection so that clicking a node name and clicking its checkbox produce the same checked-and-highlighted result.

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

### Requirement: Sync Lifecycle Status Visibility
The application MUST expose synchronization lifecycle states and progress at document and tree-node level. When a sync task is active, individual document nodes within the task's discovered scope MUST display "同步中" status regardless of whether the original selection was a leaf document, a directory subtree, or a whole space.

#### Scenario: Folder-level selection shows syncing status on descendant documents
- **WHEN** a sync task is active with a folder-level or space-level source selection
- **THEN** each discovered document node under that selection displays a "同步中" status tag in the knowledge tree
- **AND** the status transitions from "未同步" to "同步中" immediately when the task becomes active

#### Scenario: Pending task also shows syncing status
- **WHEN** a sync task is in "pending" status (created but not yet started)
- **THEN** all discovered document nodes under the task's scope display "同步中" status in the knowledge tree

#### Scenario: Individual document selection unchanged
- **WHEN** a sync task is active with individual document-level source selections
- **THEN** the behavior is unchanged — each selected document shows "同步中" status

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
The application MUST provide configuration and authentication experiences that stay structurally aligned with the reference project, MUST treat application configuration validity and signed-in user authorization validity as separate user-visible states, and MUST make localhost OAuth callback requirements and port-conflict recovery guidance explicit to the user.

#### Scenario: Settings page provides guided configuration
- **WHEN** the user opens application settings
- **THEN** the page presents guided Feishu/MCP configuration with explanatory help content in the same structured style as the reference settings page

#### Scenario: Settings page documents supported callback addresses
- **WHEN** the user reviews OAuth setup guidance in the settings page or development documentation
- **THEN** the application lists the supported localhost callback address range that must be preconfigured in the Feishu application instead of documenting only a subset of the ports that the desktop runtime may use

#### Scenario: Auth page preserves dedicated authorization flow
- **WHEN** the user needs to authorize the application
- **THEN** the application presents a dedicated auth page with a reference-style user login flow, clear status feedback, fallback actions, and navigation back to settings

#### Scenario: Valid configuration still requires user sign-in
- **WHEN** Feishu application settings are valid but no signed-in user session is active
- **THEN** the application directs the user to the auth page instead of treating configuration as equivalent to authorization

#### Scenario: Expired session requires reauthorization
- **WHEN** the application detects that a previously signed-in user session has expired or can no longer be refreshed
- **THEN** the auth experience presents a reauthorization path instead of a generic connection validation failure

#### Scenario: Auth page explains callback port exhaustion
- **WHEN** the desktop runtime cannot bind any supported localhost OAuth callback port during authorization setup
- **THEN** the auth experience shows a recovery-oriented message that explains the callback listener could not start because all supported localhost ports are unavailable

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

### Requirement: Task List Displays Immediately After Sync Start

The system MUST display the newly created sync task in the task list page immediately when the user navigates to it after clicking "开始同步", without freezing or appearing empty.

- `startSyncTask` MUST be called as fire-and-forget (not awaited) after task creation
- TaskListPage MUST accept initial tasks via props to avoid an empty initial render
- App state MUST be refreshed immediately after task creation, before starting the sync

#### Scenario: User creates sync task and navigates to task list

- Given the user is on the HomePage with a valid selection
- When the user clicks "开始同步"
- And the user navigates to the task list page
- Then the task list page shows the newly created task immediately
- And the task status updates to "syncing" via event-driven updates

### Requirement: Discovery Phase Visibility

The application MUST indicate when a sync task is in the document discovery phase, distinct from the active download phase.

#### Scenario: Show discovery status before download
- **WHEN** a sync task has been created and the backend is discovering documents to synchronize
- **THEN** the UI displays a discovery-phase status (e.g., "发现文档中...") with an indeterminate progress indicator instead of a percentage-based progress bar

#### Scenario: Transition from discovery to download
- **WHEN** document discovery completes and the backend begins downloading documents
- **THEN** the UI transitions from the discovery status to the normal sync progress display showing total document count and per-document progress updates

### Requirement: Checkbox Locking During Active Sync

The application MUST disable checkbox interaction for all currently checked source nodes once a sync task is created, and MUST re-enable them when the active sync task reaches a terminal state.

#### Scenario: Checkboxes locked after sync starts
- **WHEN** the user clicks "开始同步" and a sync task is successfully created
- **THEN** all currently checked source nodes (spaces, folders, documents, bitables) have their checkboxes disabled
- **AND** the user cannot uncheck those nodes while the task is active

#### Scenario: Unchecked nodes remain selectable
- **WHEN** a sync task is active and the user has not checked certain unsynced document nodes
- **THEN** those unchecked unsynced nodes remain selectable (checkboxes enabled)

#### Scenario: Checkboxes re-enabled after task completes
- **WHEN** the active sync task reaches "completed" status
- **THEN** all previously locked nodes have their checkboxes re-enabled

#### Scenario: Checkboxes re-enabled after task fails
- **WHEN** the active sync task reaches "partial-failed" or "paused" status
- **THEN** all previously locked nodes have their checkboxes re-enabled

#### Scenario: Already-downloaded nodes stay disabled
- **WHEN** a document has already been downloaded (present in downloadedDocumentIds)
- **THEN** its checkbox remains disabled regardless of sync task state

### Requirement: SyncTask stores discovered document IDs

The `SyncTask` interface MUST include a `discoveredDocumentIds` field that lists all individual document IDs resolved from the task's source selections at task creation time. This enables the frontend to determine per-document syncing status without re-expanding folder/space scopes.

#### Scenario: Folder selection resolves to document IDs
- **WHEN** a sync task is created with a folder-level source selection
- **THEN** the task's `discoveredDocumentIds` contains all document IDs discovered under that folder

#### Scenario: Space selection resolves to document IDs
- **WHEN** a sync task is created with a space-level source selection
- **THEN** the task's `discoveredDocumentIds` contains all document IDs discovered under that space

#### Scenario: Single document selection preserves its ID
- **WHEN** a sync task is created with an individual document selection
- **THEN** the task's `discoveredDocumentIds` contains that document's ID

### Requirement: Task list bulk clear

The application MUST provide a control on the dedicated sync task list page that removes every stored sync task in a single user-confirmed action. The action MUST persist an empty task list for both Tauri and browser runtimes and MUST clear any runtime bookkeeping that would block starting new sync tasks after the list is emptied.

#### Scenario: User clears all tasks from the task list

- **WHEN** the user opens the sync task list page and at least one task exists
- **THEN** the UI exposes a control whose label clearly indicates that all sync tasks will be removed
- **AND** the user MUST confirm the action before any tasks are deleted

#### Scenario: Empty list after bulk clear

- **WHEN** the user confirms bulk clear
- **THEN** the task list becomes empty immediately in the UI
- **AND** reloading the application or revisiting the task list still shows no tasks until new ones are created

#### Scenario: New sync can start after bulk clear

- **WHEN** the user had previously started a sync run and then performed a bulk clear
- **THEN** the user MUST still be able to create and start a new sync task without requiring an application restart

### Requirement: Non-Blocking Page Transitions After Bootstrap Calls
The application MUST perform page navigation immediately when the user saves settings or completes authorization, without waiting for the `getAppBootstrap` call to return, so that the UI does not freeze during the bootstrap network round-trip.

#### Scenario: Settings save transitions to auth page without delay
- **WHEN** the user saves settings on the SettingsPage
- **THEN** the application transitions to the auth page immediately
- **AND** bootstrap data such as `resolvedSyncRoot` is loaded asynchronously after the page transition

#### Scenario: Authorization success transitions to home page without delay
- **WHEN** the user completes Feishu authorization on the AuthPage
- **THEN** the application transitions to the home page immediately using data already returned from `completeUserAuthorization`
- **AND** supplementary bootstrap data such as `resolvedSyncRoot` is loaded asynchronously after the page transition

