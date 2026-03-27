## MODIFIED Requirements

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
