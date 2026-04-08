# tauri-desktop-runtime-and-backend Specification

## Purpose
TBD - created by archiving change create-feishu-knowledge-base-sync-app. Update Purpose after archive.
## Requirements
### Requirement: Real Tauri Desktop Runtime
The application MUST be implemented and runnable as a real Tauri desktop application rather than only as a browser-based frontend, and the development runtime MUST tolerate preferred localhost port conflicts without requiring immediate manual reconfiguration.

#### Scenario: Tauri dev workflow is available
- **WHEN** a developer sets up the project locally
- **THEN** the repository provides the configuration and scripts required to run the app through a Tauri development workflow

#### Scenario: Tauri dev workflow falls back from occupied localhost port
- **WHEN** a developer starts the Tauri development workflow while the preferred frontend localhost port is already occupied
- **THEN** the development runtime recovers by using another available localhost port instead of failing only because the preferred port is unavailable

#### Scenario: Tauri dev wrapper starts on Windows
- **WHEN** a developer runs the repository's Tauri development wrapper on Windows
- **THEN** the wrapper successfully launches the underlying Tauri CLI instead of failing because of platform-specific command invocation details

#### Scenario: Native window configuration exists
- **WHEN** the application is packaged or started in desktop mode
- **THEN** it uses an explicit Tauri window and application configuration rather than relying solely on browser defaults

### Requirement: Rust-Side Sync Orchestration
The system MUST execute native sync responsibilities in the Tauri/Rust backend, and MUST normalize sync task metadata so output destinations and timestamps remain trustworthy across the desktop runtime.

#### Scenario: Frontend starts sync through backend command
- **WHEN** a user starts a synchronization job from the UI
- **THEN** the frontend triggers a Tauri command or equivalent backend entry point rather than executing the full sync pipeline only in browser code

#### Scenario: Backend writes synchronized outputs
- **WHEN** a document is synchronized successfully
- **THEN** Markdown files, manifests, and fallback image assets are written by backend-owned filesystem logic

#### Scenario: Backend resolves effective sync root
- **WHEN** a sync task is created from a configured output path
- **THEN** the backend resolves the effective sync destination deterministically and stores a trustworthy path for task display and file writes

#### Scenario: Backend stores parseable task timestamps
- **WHEN** sync task metadata is created or updated
- **THEN** the backend stores timestamps in a machine-parseable format that frontend task history can render without invalid dates

### Requirement: Structured Sync Failure Reporting
The system MUST return structured sync failure categories and concise diagnostics from the backend runtime to the frontend task views.

#### Scenario: Backend classifies failed document stage
- **WHEN** a document fails during synchronization
- **THEN** the backend records the pipeline stage category and a concise diagnostic message for that failure

#### Scenario: Backend preserves run-level failure context
- **WHEN** a sync run completes with repeated failures across many or all documents
- **THEN** the backend preserves enough summary context for the frontend to indicate the dominant failure stage without inspecting raw logs

### Requirement: Frontend and Backend Event Bridging
The system MUST communicate long-running sync state through explicit frontend/backend command and event channels.

#### Scenario: Backend emits task progress
- **WHEN** a sync task advances or changes state
- **THEN** the backend emits progress or status events that the frontend consumes to update task views

#### Scenario: Frontend restores task state after restart
- **WHEN** the application restarts while prior sync tasks exist
- **THEN** the frontend requests persisted task state from the backend and restores task visibility consistently

### Requirement: Backend-Owned User Session Persistence
The system MUST persist and restore the signed-in user's authorization session in the Tauri/Rust backend.

#### Scenario: Bootstrap restores valid signed-in session
- **WHEN** the application starts and previously stored user session state is still valid
- **THEN** backend bootstrap returns signed-in user information and authorization status without requiring immediate re-login

#### Scenario: Bootstrap reports expired session state
- **WHEN** stored user session state can no longer be refreshed or used for protected Feishu operations
- **THEN** backend bootstrap reports an expired or reauthorization-required state instead of presenting the user as fully authorized

### Requirement: User-Authorized API Execution
The system MUST execute Feishu knowledge-base operations through backend-owned user-authorized API clients.

#### Scenario: Knowledge base discovery uses user-authorized client
- **WHEN** the frontend requests knowledge base loading or connection validation
- **THEN** the backend performs those protected Feishu operations with the current signed-in user's authorization context

#### Scenario: Sync command rejects missing user session
- **WHEN** the frontend asks the backend to start or resume synchronization without a valid signed-in user session
- **THEN** the backend rejects the request with an authorization-specific result instead of attempting protected operations with application-only credentials

### Requirement: Session Refresh and Reauthorization Classification
The system MUST refresh user session state when possible and MUST classify reauthorization-required failures explicitly when refresh cannot be completed.

#### Scenario: Protected call refreshes expiring session
- **WHEN** a protected Feishu knowledge-base operation requires a refreshable user session before execution
- **THEN** the backend attempts session refresh before classifying the request as unauthorized

#### Scenario: Refresh failure requires reauthorization
- **WHEN** the backend cannot refresh the signed-in user's session for a protected knowledge-base operation
- **THEN** the operation returns a reauthorization-required result that the frontend can map to a dedicated recovery flow

### Requirement: Desktop Subtree Selection Regression Automation
The repository MUST provide a tauri-driver based desktop automation workflow that validates document subtree selection behavior against a deterministic Tauri runtime fixture.

#### Scenario: Automated desktop validation uses fixture runtime
- **WHEN** a developer runs the subtree-selection desktop regression workflow
- **THEN** the workflow launches the Tauri desktop application through tauri-driver with deterministic fixture data for knowledge base spaces, source trees, and task history instead of depending on the developer's real Feishu account state

#### Scenario: Automated desktop validation covers subtree interactions
- **WHEN** the desktop regression workflow executes
- **THEN** it verifies at least leaf-document selection, parent-document subtree coverage, descendant checkbox disablement, same-knowledge-base multi-root selection, and cross-knowledge-base switching behavior in the real desktop runtime

#### Scenario: Automated desktop validation covers task summaries
- **WHEN** the desktop regression workflow opens the task list
- **THEN** it verifies subtree-aware source-summary rendering and effective document-count presentation for seeded subtree tasks

### Requirement: Non-Blocking Tree and Task Commands
The application MUST execute tree-loading and sync-task-creation Tauri commands asynchronously so the UI thread remains responsive during Feishu API calls. The `get_app_bootstrap` command MUST also execute asynchronously so that bootstrap-time network calls do not block the UI thread.

#### Scenario: Expanding tree nodes does not freeze the UI
- **WHEN** a user expands a knowledge base node or document node in the source-selection tree
- **THEN** the HTTP calls to list child nodes run on a background thread and the window remains responsive

#### Scenario: Creating a sync task does not freeze the UI
- **WHEN** a user creates a sync task that requires discovering documents from multiple knowledge base nodes
- **THEN** the document discovery HTTP calls run on a background thread and the window remains responsive

#### Scenario: App bootstrap does not freeze the UI
- **WHEN** the frontend calls `get_app_bootstrap` (at application start, after settings save, or after authorization)
- **THEN** the bootstrap command executes its network calls on a background thread and the window remains responsive

### Requirement: Backend-Owned Workspace Folder Opener
The application MUST open the effective sync root through a backend-owned Tauri command rather than relying solely on the frontend local-path opener path, so absolute user directories can be opened reliably in the system file manager.

#### Scenario: Open workspace folder through backend command
- **WHEN** the user clicks the "打开" action beside the effective sync root in the HomePage
- **THEN** the frontend invokes a Tauri backend command that opens the requested local folder in the system file manager

#### Scenario: Absolute user directory can be opened
- **WHEN** the effective sync root resolves to an absolute directory such as a path under the user's Documents folder
- **THEN** the backend opener flow succeeds without returning `Not allowed to open path ...`

#### Scenario: Backend opener failure reaches the frontend
- **WHEN** the backend cannot open the requested folder path
- **THEN** the command returns an error that the frontend can translate into the existing user-facing directory-open failure messages

### Requirement: Open Feishu documents in system browser
The application MUST open Feishu document and bitable links in the system's default browser from the desktop knowledge-tree UI, and MUST return actionable failure details when the browser launch cannot be completed.

#### Scenario: Document browser action opens a Feishu document URL
- **WHEN** the user clicks the browser action for a document node in the knowledge tree
- **THEN** the desktop runtime opens `https://feishu.cn/docx/<document-id>` in the system's default browser

#### Scenario: Subtree-capable document node opens the document page
- **WHEN** the user clicks the browser action for a document node that also has descendants in the knowledge tree
- **THEN** the desktop runtime still opens that document's Feishu `docx` page by using the node's document identifier rather than the tree node token

#### Scenario: Bitable browser action opens a Feishu bitable URL
- **WHEN** the user clicks the browser action for a bitable node in the knowledge tree
- **THEN** the desktop runtime opens `https://feishu.cn/base/<token>` in the system's default browser

#### Scenario: Browser launch failure reaches the frontend
- **WHEN** the desktop runtime cannot open the requested Feishu URL
- **THEN** the browser-opening helper returns a failed result with an error message that the frontend can show to the user

### Requirement: Feishu Drive export_task OpenAPI envelope parsing

The backend Feishu OpenAPI client MUST parse successful create and query responses for `/drive/v1/export_tasks` using the standard Feishu Open Platform JSON envelope (`code`, `msg`, `data`). It MUST read the export task ticket from `data.ticket` when creating a task, and MUST read task status fields (including `job_status` and `file_token`) from `data.result` when polling. It SHOULD accept a root-level `ticket` or `result` only as a backward-compatible fallback for tests or atypical gateways.

#### Scenario: Create export task reads ticket from data

- **WHEN** the client handles a successful `POST /drive/v1/export_tasks` response whose body matches the documented shape (`code` is 0 and `data.ticket` is present)
- **THEN** the client extracts the ticket string from `data.ticket` and proceeds to poll export status

#### Scenario: Query export task reads result from data

- **WHEN** the client handles a successful `GET /drive/v1/export_tasks/{ticket}` response whose body matches the documented shape (`code` is 0 and `data.result` is present)
- **THEN** the client reads `job_status` and related fields from `data.result` to decide whether the export finished, failed, or should be polled again

#### Scenario: Non-zero OpenAPI code on create does not masquerade as missing ticket

- **WHEN** the create export task response has a non-zero `code` and an error `msg`
- **THEN** the client surfaces that API error and does not report `export_tasks missing ticket` solely because `ticket` is absent

### Requirement: Restrained console output for Feishu throttle retries

The native backend MUST NOT emit a console line tagged as a warning for each intermediate retry when a Feishu OpenAPI call returns a recognized frequency-limit (throttle) response and the shared retry helper will attempt another request within the configured retry budget.

#### Scenario: No per-attempt warning during in-budget throttle retries

- **WHEN** a Feishu OpenAPI call wrapped by the shared throttle retry helper receives a throttling response and at least one retry attempt remains
- **THEN** the runtime MUST NOT print a `[warn]`-prefixed line for that intermediate throttling event

#### Scenario: Warning remains when throttle retries are exhausted

- **WHEN** the shared throttle retry helper consumes the full retry budget and the final attempt still returns a throttling response
- **THEN** the runtime MUST emit a clear warning indicating that throttling retries were exhausted

### Requirement: Document freshness OpenAPI calls are paced and retried

The `check_document_freshness` command MUST process each input document id sequentially inside its blocking worker. For each document that requires a **docx document info / summary** OpenAPI round-trip (non-`export:` manifest records), the implementation MUST call the same retry-wrapped helper used elsewhere for document summary (`fetch_document_summary_with_retry` or equivalent), and MUST insert a fixed minimum delay between the **start** of one such OpenAPI request and the **start** of the next (skipping the delay before the first docx request in the batch). Export-only records MUST NOT trigger docx summary calls or this inter-request delay.

#### Scenario: Spacing between docx summary calls

- **WHEN** the batch contains at least two document ids that both require a docx summary API call
- **THEN** the second call’s request MUST NOT begin until at least the configured minimum interval after the first call’s request has begun

#### Scenario: Throttle-aware retry

- **WHEN** the Feishu API returns a recognized frequency-limit response for a document summary call inside `check_document_freshness`
- **THEN** the command uses the shared throttle retry helper with backoff before surfacing a terminal error for that document

