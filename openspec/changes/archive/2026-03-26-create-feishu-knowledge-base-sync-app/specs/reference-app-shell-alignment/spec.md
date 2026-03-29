## ADDED Requirements

### Requirement: Reference App Shell Parity
The application MUST preserve the overall desktop shell structure of `./feishu_docs_export` unless a synchronization-specific behavior requires a deliberate deviation.

#### Scenario: Reuse top-level shell pattern
- **WHEN** the application renders its top-level layout
- **THEN** it uses the same overall shell pattern as the reference app, including header, content area, and page-based rendering flow

#### Scenario: Preserve major page decomposition
- **WHEN** the application is implemented
- **THEN** its top-level frontend decomposition follows the same page-oriented structure as the reference app, adapted from export terminology to sync terminology

#### Scenario: Preserve Tauri-based shell ownership
- **WHEN** the app shell is wired into runtime behavior
- **THEN** its page shell is hosted inside the Tauri desktop runtime model used by the reference project rather than only a browser-hosted SPA shell

### Requirement: Reference Navigation Rhythm
The application MUST keep the reference project's page progression pattern of configuration, authentication, primary workspace, and task history/status views.

#### Scenario: Missing configuration enters settings
- **WHEN** required Feishu or sync configuration is not yet valid
- **THEN** the user is directed to a settings page before starting authentication or synchronization

#### Scenario: Authenticated user enters main workspace
- **WHEN** configuration and authentication are both valid
- **THEN** the user enters a main workspace page corresponding to the reference project's home page role

### Requirement: Reference Task Model Adaptation
The application MUST adapt the reference project's long-running task model and event-driven status updates for synchronization jobs.

#### Scenario: Background sync updates task-style view
- **WHEN** a sync job is running or being resumed
- **THEN** the application updates a task/status view through task-oriented progress and state updates rather than relying only on transient notifications

#### Scenario: Retry and resume remain first-class actions
- **WHEN** a sync job partially fails or is interrupted
- **THEN** the user can retry or resume synchronization through the same task-oriented interaction pattern used by the reference app
