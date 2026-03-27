## MODIFIED Requirements

### Requirement: Configuration and Authentication Experience Parity
The application MUST provide configuration and authentication experiences that stay structurally aligned with the reference project, MUST treat application configuration validity and signed-in user authorization validity as separate user-visible states, and MUST make localhost OAuth callback requirements and port-conflict recovery guidance explicit to the user.

#### Scenario: Settings page provides guided configuration
- **WHEN** the user opens application settings
- **THEN** the page presents guided Feishu/MCP configuration with explanatory help content in the same structured style as the reference settings page

#### Scenario: Settings page documents supported callback addresses
- **WHEN** the user reviews OAuth setup guidance in the settings page or development documentation
- **THEN** the application lists the supported localhost callback address range that must be preconfigured in the Feishu application instead of documenting only a subset of the ports that the desktop runtime may use

#### Scenario: Auth page preserves dedicated authorization flow
- **WHEN** the user needs to authorize the application
- **THEN** the application presents a dedicated auth page with a reference-style user login flow, clear status feedback, fallback actions, and navigation back to settings

#### Scenario: Valid configuration still requires user sign-in
- **WHEN** Feishu application settings are valid but no signed-in user session is active
- **THEN** the application directs the user to the auth page instead of treating configuration as equivalent to authorization

#### Scenario: Expired session requires reauthorization
- **WHEN** the application detects that a previously signed-in user session has expired or can no longer be refreshed
- **THEN** the auth experience presents a reauthorization path instead of a generic connection validation failure

#### Scenario: Auth page explains callback port exhaustion
- **WHEN** the desktop runtime cannot bind any supported localhost OAuth callback port during authorization setup
- **THEN** the auth experience shows a recovery-oriented message that explains the callback listener could not start because all supported localhost ports are unavailable
