## ADDED Requirements

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
