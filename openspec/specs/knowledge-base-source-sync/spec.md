# knowledge-base-source-sync Specification

## Purpose
TBD - created by archiving change create-feishu-knowledge-base-sync-app. Update Purpose after archive.
## Requirements
### Requirement: Knowledge Base Scoped Discovery
The system MUST discover, present, and queue only documents that belong to user-selected knowledge base scopes. A selectable scope MUST support an entire knowledge base, a directory subtree within that knowledge base, or an individual document.

#### Scenario: Ignore non-knowledge-base sources
- **WHEN** the source enumeration includes Feishu document containers outside selected knowledge base scopes
- **THEN** the sync planner excludes those items from the sync queue

#### Scenario: Build queue from selected knowledge base
- **WHEN** the user selects an entire knowledge base and starts synchronization
- **THEN** the system builds a sync queue containing all documents that belong to that knowledge base

#### Scenario: Build queue from selected directory subtree
- **WHEN** the user selects a directory inside a knowledge base and starts synchronization
- **THEN** the system builds a sync queue containing documents in that directory and its descendant directories only

#### Scenario: Build queue from selected individual document
- **WHEN** the user selects a single document inside a knowledge base and starts synchronization
- **THEN** the system builds a sync queue containing only that document

### Requirement: Incremental Synchronization Planning
The system MUST perform incremental synchronization using persisted sync state for the currently selected scopes, and MUST skip unchanged in-scope documents safely without re-queuing out-of-scope documents.

#### Scenario: Skip unchanged document in selected scope
- **WHEN** a document inside the selected scope has remote version metadata that matches the local manifest state
- **THEN** the planner marks the document as no-op and does not re-fetch content

#### Scenario: Include changed document in selected scope
- **WHEN** a document inside the selected scope has remote version metadata that differs from the local manifest state
- **THEN** the planner marks the document for re-fetch and output regeneration

#### Scenario: Exclude document outside selected scope
- **WHEN** a previously synced document exists in manifest state but is outside the scope selected for the current synchronization run
- **THEN** the planner does not queue that document for the current run

### Requirement: Persistent Sync Manifest
The system MUST persist per-document sync metadata sufficient for retry, audit, scoped planning, and subsequent incremental runs.

#### Scenario: Record successful sync entry
- **WHEN** a document sync completes successfully
- **THEN** the manifest stores document identifier, selected scope context, source-relative path metadata, output path, and last successful sync timestamp

#### Scenario: Record failed sync entry
- **WHEN** a document sync fails
- **THEN** the manifest stores failure status and error classification without deleting prior successful metadata for other documents

### Requirement: Knowledge Space Discovery Uses Authoritative Access Check
The system MUST determine Feishu knowledge space accessibility using the same effective backend access path as space discovery or synchronization planning, and MUST NOT reject a configuration solely because a narrower preflight check failed first.

#### Scenario: Valid configuration is not blocked by false-negative preflight
- **WHEN** an initial connection validation probe fails but the configured Feishu/MCP integration can successfully enumerate accessible knowledge spaces through the authoritative discovery path
- **THEN** the system reports the connection as usable and returns the discovered knowledge spaces

#### Scenario: Discovery path determines final failure
- **WHEN** connection validation starts and the authoritative knowledge space discovery path fails due to transport, authentication, or permission errors
- **THEN** the system classifies the connection as failed using the authoritative discovery error rather than a generic preflight failure

### Requirement: Knowledge Space Discovery Classifies Empty And Error Outcomes
The system MUST distinguish an authoritative empty result from an error result when loading knowledge spaces.

#### Scenario: No joined knowledge spaces
- **WHEN** authoritative discovery completes successfully and returns zero accessible knowledge spaces
- **THEN** the system classifies the result as `connected-no-spaces` rather than a connection failure

#### Scenario: Permission denied during space discovery
- **WHEN** authoritative discovery fails because the app lacks required wiki read access or equivalent knowledge base access permission
- **THEN** the system classifies the result as `permission-denied` and includes a diagnostic that indicates missing knowledge base access rather than returning an empty list

#### Scenario: Unexpected response shape during discovery
- **WHEN** the discovery response is received but does not contain the fields required to determine knowledge space accessibility
- **THEN** the system classifies the result as `unexpected-response` and does not present the result as a normal empty space list

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

