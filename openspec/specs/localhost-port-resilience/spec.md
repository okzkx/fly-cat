# localhost-port-resilience Specification

## Purpose
TBD - created by archiving change optimize-tauri-port-handling. Update Purpose after archive.
## Requirements
### Requirement: Local Development Port Recovery
The system MUST allow the Tauri development workflow to recover automatically when the preferred local frontend port is already occupied.

#### Scenario: Preferred dev port is unavailable
- **WHEN** a developer starts the Tauri development workflow and the preferred Vite port is already in use
- **THEN** the frontend dev server starts on another available localhost port instead of failing immediately because the preferred port is occupied

### Requirement: OAuth Callback Port Pool
The system MUST initialize the desktop OAuth callback listener from a predefined localhost port pool that is large enough to tolerate common local conflicts while remaining documentable for Feishu callback configuration.

#### Scenario: One callback port is occupied
- **WHEN** the preferred OAuth callback port is occupied by another local process
- **THEN** the desktop runtime retries initialization on another configured localhost callback port from the supported pool

#### Scenario: All callback ports are unavailable
- **WHEN** no configured localhost callback port can be bound for the desktop OAuth callback listener
- **THEN** the user sees an actionable error that indicates local port conflict and points them to the supported callback address configuration

### Requirement: Development Port Lifecycle Cleanup
The system MUST clean up the development process tree started by the Tauri dev wrapper when that wrapper exits, so that localhost ports used by the wrapper-controlled dev session can be reused by a subsequent session.

#### Scenario: Wrapper-controlled dev session exits
- **WHEN** the custom `npm run tauri dev` wrapper exits after starting a frontend dev server and Tauri dev process
- **THEN** it terminates the dev process tree it started before finishing its own shutdown sequence

#### Scenario: Next dev session reuses released port
- **WHEN** a wrapper-controlled dev session has exited cleanly and a new dev session starts soon after
- **THEN** the previously selected localhost development port is available for reuse unless another external process has claimed it

