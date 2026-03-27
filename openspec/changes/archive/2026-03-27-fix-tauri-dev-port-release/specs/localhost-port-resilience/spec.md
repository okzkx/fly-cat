## ADDED Requirements

### Requirement: Development Port Lifecycle Cleanup
The system MUST clean up the development process tree started by the Tauri dev wrapper when that wrapper exits, so that localhost ports used by the wrapper-controlled dev session can be reused by a subsequent session.

#### Scenario: Wrapper-controlled dev session exits
- **WHEN** the custom `npm run tauri dev` wrapper exits after starting a frontend dev server and Tauri dev process
- **THEN** it terminates the dev process tree it started before finishing its own shutdown sequence

#### Scenario: Next dev session reuses released port
- **WHEN** a wrapper-controlled dev session has exited cleanly and a new dev session starts soon after
- **THEN** the previously selected localhost development port is available for reuse unless another external process has claimed it
