## MODIFIED Requirements

### Requirement: Reference Navigation Rhythm
The application MUST keep the reference project's page progression pattern of configuration, authentication, primary workspace, and task history/status views, and MUST gate entry to the primary workspace on both valid configuration and a valid signed-in user session.

#### Scenario: Missing configuration enters settings
- **WHEN** required Feishu or sync configuration is not yet valid
- **THEN** the user is directed to a settings page before starting authentication or synchronization

#### Scenario: Configured but signed-out user enters auth
- **WHEN** required configuration is valid but no signed-in user session is available
- **THEN** the user is directed to the auth page before entering the primary workspace

#### Scenario: Authenticated user enters main workspace
- **WHEN** configuration is valid and the signed-in user session is valid
- **THEN** the user enters a main workspace page corresponding to the reference project's home page role

## ADDED Requirements

### Requirement: Reference Signed-In Shell Presence
The application MUST preserve the reference project's signed-in shell cues for the active user session.

#### Scenario: Header shows signed-in user context
- **WHEN** a user has completed authorization successfully
- **THEN** the shell header displays the current signed-in user context in the same structural region used by the reference project

#### Scenario: Shell exposes sign-out or reauthorization entry point
- **WHEN** the user is signed in or the session requires renewal
- **THEN** the shell provides a first-class sign-out or reauthorization action consistent with the reference project's user-session pattern
