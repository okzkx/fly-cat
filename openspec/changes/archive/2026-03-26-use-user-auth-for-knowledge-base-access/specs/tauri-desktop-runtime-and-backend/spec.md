## ADDED Requirements

### Requirement: Backend-Owned User Session Persistence
The system MUST persist and restore the signed-in user's authorization session in the Tauri/Rust backend.

#### Scenario: Bootstrap restores valid signed-in session
- **WHEN** the application starts and previously stored user session state is still valid
- **THEN** backend bootstrap returns signed-in user information and authorization status without requiring immediate re-login

#### Scenario: Bootstrap reports expired session state
- **WHEN** stored user session state can no longer be refreshed or used for protected Feishu operations
- **THEN** backend bootstrap reports an expired or reauthorization-required state instead of presenting the user as fully authorized

### Requirement: User-Authorized API Execution
The system MUST execute Feishu knowledge-base operations through backend-owned user-authorized API clients.

#### Scenario: Knowledge base discovery uses user-authorized client
- **WHEN** the frontend requests knowledge base loading or connection validation
- **THEN** the backend performs those protected Feishu operations with the current signed-in user's authorization context

#### Scenario: Sync command rejects missing user session
- **WHEN** the frontend asks the backend to start or resume synchronization without a valid signed-in user session
- **THEN** the backend rejects the request with an authorization-specific result instead of attempting protected operations with application-only credentials

### Requirement: Session Refresh and Reauthorization Classification
The system MUST refresh user session state when possible and MUST classify reauthorization-required failures explicitly when refresh cannot be completed.

#### Scenario: Protected call refreshes expiring session
- **WHEN** a protected Feishu knowledge-base operation requires a refreshable user session before execution
- **THEN** the backend attempts session refresh before classifying the request as unauthorized

#### Scenario: Refresh failure requires reauthorization
- **WHEN** the backend cannot refresh the signed-in user's session for a protected knowledge-base operation
- **THEN** the operation returns a reauthorization-required result that the frontend can map to a dedicated recovery flow
