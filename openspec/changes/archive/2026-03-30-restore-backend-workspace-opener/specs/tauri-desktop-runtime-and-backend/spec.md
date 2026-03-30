## ADDED Requirements

### Requirement: Backend-owned workspace folder opener
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
