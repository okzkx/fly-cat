## MODIFIED Requirements

### Requirement: Configuration and Authentication Experience Parity
The application MUST provide configuration and authentication experiences that stay structurally aligned with the reference project, and MUST treat application configuration validity and signed-in user authorization validity as separate user-visible states.

#### Scenario: Settings page provides guided configuration
- **WHEN** the user opens application settings
- **THEN** the page presents guided Feishu/MCP configuration with explanatory help content in the same structured style as the reference settings page

#### Scenario: Auth page preserves dedicated authorization flow
- **WHEN** the user needs to authorize the application
- **THEN** the application presents a dedicated auth page with a reference-style user login flow, clear status feedback, fallback actions, and navigation back to settings

#### Scenario: Valid configuration still requires user sign-in
- **WHEN** Feishu application settings are valid but no signed-in user session is active
- **THEN** the application directs the user to the auth page instead of treating configuration as equivalent to authorization

#### Scenario: Expired session requires reauthorization
- **WHEN** the application detects that a previously signed-in user session has expired or can no longer be refreshed
- **THEN** the auth experience presents a reauthorization path instead of a generic connection validation failure

## ADDED Requirements

### Requirement: User Authorization State Guidance
The application MUST present user-authorization recovery states distinctly from generic transport or configuration failures.

#### Scenario: Signed-out guidance is actionable
- **WHEN** the user has not completed the required Feishu user login flow
- **THEN** the UI indicates that sign-in is required before knowledge bases can be loaded and provides a direct action to begin authorization

#### Scenario: Permission-denied guidance reflects user access
- **WHEN** the backend determines that the signed-in user lacks access to the requested knowledge base operations
- **THEN** the UI tells the user that the current account lacks permission and does not describe the state as only an application-configuration problem

#### Scenario: Reauthorization guidance is shown for expired session
- **WHEN** the backend classifies the current authorization state as expired or reauthorization-required
- **THEN** the UI shows a reauthorization-focused recovery message and retry entry point
