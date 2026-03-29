## ADDED Requirements

### Requirement: Opener Permission for Opening Local Paths
The application MUST have the `opener:allow-open-path` permission configured to allow the frontend to open local folders in the system file manager.

#### Scenario: Open workspace button works correctly
- **WHEN** user clicks the "Open Workspace" button in the UI
- **THEN** the system opens the specified folder in the system file manager without permission error

#### Scenario: Permission configuration includes opener open-path
- **WHEN** the Tauri application starts
- **THEN** the capabilities configuration includes `opener:allow-open-path` permission
