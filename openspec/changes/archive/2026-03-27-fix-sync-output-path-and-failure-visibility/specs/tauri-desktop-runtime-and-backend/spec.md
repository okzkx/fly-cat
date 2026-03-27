## MODIFIED Requirements

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

## ADDED Requirements

### Requirement: Structured Sync Failure Reporting
The system MUST return structured sync failure categories and concise diagnostics from the backend runtime to the frontend task views.

#### Scenario: Backend classifies failed document stage
- **WHEN** a document fails during synchronization
- **THEN** the backend records the pipeline stage category and a concise diagnostic message for that failure

#### Scenario: Backend preserves run-level failure context
- **WHEN** a sync run completes with repeated failures across many or all documents
- **THEN** the backend preserves enough summary context for the frontend to indicate the dominant failure stage without inspecting raw logs
