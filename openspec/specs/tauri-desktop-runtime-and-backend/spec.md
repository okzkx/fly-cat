# tauri-desktop-runtime-and-backend Specification

## Purpose
TBD - created by archiving change create-feishu-knowledge-base-sync-app. Update Purpose after archive.
## Requirements
### Requirement: Real Tauri Desktop Runtime
The application MUST be implemented and runnable as a real Tauri desktop application rather than only as a browser-based frontend.

#### Scenario: Tauri dev workflow is available
- **WHEN** a developer sets up the project locally
- **THEN** the repository provides the configuration and scripts required to run the app through a Tauri development workflow

#### Scenario: Native window configuration exists
- **WHEN** the application is packaged or started in desktop mode
- **THEN** it uses an explicit Tauri window and application configuration rather than relying solely on browser defaults

### Requirement: Rust-Side Sync Orchestration
The system MUST execute native sync responsibilities in the Tauri/Rust backend.

#### Scenario: Frontend starts sync through backend command
- **WHEN** a user starts a synchronization job from the UI
- **THEN** the frontend triggers a Tauri command or equivalent backend entry point rather than executing the full sync pipeline only in browser code

#### Scenario: Backend writes synchronized outputs
- **WHEN** a document is synchronized successfully
- **THEN** Markdown files, manifests, and fallback image assets are written by backend-owned filesystem logic

### Requirement: Frontend and Backend Event Bridging
The system MUST communicate long-running sync state through explicit frontend/backend command and event channels.

#### Scenario: Backend emits task progress
- **WHEN** a sync task advances or changes state
- **THEN** the backend emits progress or status events that the frontend consumes to update task views

#### Scenario: Frontend restores task state after restart
- **WHEN** the application restarts while prior sync tasks exist
- **THEN** the frontend requests persisted task state from the backend and restores task visibility consistently

