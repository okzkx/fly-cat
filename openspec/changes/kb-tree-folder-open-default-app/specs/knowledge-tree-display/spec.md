## ADDED Requirements

### Requirement: Folder node opens local synced directory with default application

The system SHALL show an actionable control on each **folder** node in the knowledge base tree (alongside the existing type icon and title) that opens the folder’s corresponding path under the configured Markdown sync root using the same OS integration as opening the sync root folder (typically the system file manager via the default application). The resolved filesystem path MUST apply the same path segment sanitization rules as document output paths so that the opened directory matches where synced content for that subtree is written.

#### Scenario: Desktop user opens a folder node

- **WHEN** the application runs in the Tauri desktop runtime and the user activates the folder node’s “open with default application” control
- **THEN** the system invokes the existing workspace-folder open command with the computed absolute directory path for that folder under `syncRoot`

#### Scenario: Local directory missing

- **WHEN** the computed directory does not exist on disk
- **THEN** the system shows a clear error to the user (for example that the directory does not exist and sync may be needed) and does not claim success

#### Scenario: Non-desktop runtime

- **WHEN** the application is not running in the Tauri desktop runtime
- **THEN** the control either is not offered or activation results in the same non-desktop failure feedback pattern as other local folder open actions
