## ADDED Requirements

### Requirement: Document and bitable nodes open local synced Markdown with default application

The system SHALL show the same style of actionable control used for **folder** nodes’ “open with default application” action on each **document** and **bitable** node in the knowledge base tree (alongside existing per-row actions). Activation SHALL open the Markdown file path under the configured sync root that corresponds to that node’s synced export, using the same path segment sanitization and filename rules as the sync pipeline’s document output mapping.

#### Scenario: Desktop user opens a document node

- **WHEN** the application runs in the Tauri desktop runtime, a sync root is configured, the local exported Markdown file for that document exists, and the user activates the document node’s “open with default application” control
- **THEN** the system opens that file with the OS default application via the same backend opener integration used for opening the sync root folder

#### Scenario: Desktop user opens a bitable node

- **WHEN** the application runs in the Tauri desktop runtime, a sync root is configured, the local exported Markdown file for that bitable exists, and the user activates the bitable node’s “open with default application” control
- **THEN** the system opens that file with the OS default application via the same backend opener integration

#### Scenario: Local Markdown file missing

- **WHEN** the computed Markdown file path does not exist on disk
- **THEN** the system shows a clear error to the user (for example that the file does not exist and sync may be needed) and does not claim success

#### Scenario: Non-desktop runtime

- **WHEN** the application is not running in the Tauri desktop runtime
- **THEN** activation results in the same non-desktop failure feedback pattern as other local folder open actions
