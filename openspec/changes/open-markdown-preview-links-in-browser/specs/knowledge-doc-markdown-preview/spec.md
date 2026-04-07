## ADDED Requirements

### Requirement: Markdown preview links open outside the app
The system SHALL prevent the knowledge-tree markdown preview area from navigating the current application page when a user clicks an external link rendered from synced markdown. For supported external URLs, the system SHALL open the target with the operating system's default browser handler and SHALL surface an actionable error when that handoff fails.

#### Scenario: Clicking an external preview link opens the default browser
- **WHEN** the user clicks a markdown preview link whose href resolves to an `http`, `https`, or `mailto` URL
- **THEN** the application SHALL prevent in-app page navigation
- **AND** the resolved URL SHALL be opened by the system default browser or mail client

#### Scenario: Browser handoff failure is visible to the user
- **WHEN** the application fails to hand the clicked preview URL to the operating system
- **THEN** the preview interaction SHALL keep the current page in place
- **AND** the frontend SHALL show an error message indicating that the link could not be opened
