## ADDED Requirements

### Requirement: Open workspace folder button

The system SHALL provide a button on HomePage to open the sync folder in the system file manager with a single click.

#### Scenario: Open existing sync folder

- **WHEN** the user clicks the "Open Workspace" button and the sync folder exists
- **THEN** the system file manager opens and navigates to the sync folder

#### Scenario: Show error when folder does not exist

- **WHEN** the user clicks the "Open Workspace" button and the sync folder does not exist
- **THEN** an error message "Directory does not exist, please sync first" is displayed
- **AND** the file manager is not opened

#### Scenario: Show error when permission denied

- **WHEN** the user clicks the "Open Workspace" button and the sync folder exists but access is denied
- **THEN** an error message "Cannot access the directory" is displayed
