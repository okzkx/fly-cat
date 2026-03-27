## ADDED Requirements

### Requirement: User-Authorized Knowledge Base Access
The system MUST perform knowledge base discovery, document enumeration, and synchronization using the currently signed-in user's effective Feishu permissions rather than application-only credentials.

#### Scenario: Signed-in user discovers accessible spaces
- **WHEN** Feishu application settings are valid and a user has signed in successfully
- **THEN** the system loads only knowledge base spaces that are accessible to that signed-in user

#### Scenario: Signed-out state blocks discovery
- **WHEN** no valid signed-in user session is present
- **THEN** the system does not treat saved application configuration alone as sufficient to enumerate knowledge bases or start synchronization

### Requirement: Sync Authorization Must Stay Consistent
The system MUST use the same user authorization context for synchronization execution that was used for pre-sync discovery and source selection.

#### Scenario: Sync start requires a valid user session
- **WHEN** a user starts a synchronization task after selecting knowledge base spaces
- **THEN** the backend starts the task only if the current signed-in user session is still valid for knowledge base access

#### Scenario: Session expiry during sync does not fall back to app-only access
- **WHEN** the signed-in user's session expires or is revoked while a synchronization task is running
- **THEN** the task stops or becomes partially failed with an authorization-specific error instead of silently falling back to application-only credentials
