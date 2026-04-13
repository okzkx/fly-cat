## ADDED Requirements

### Requirement: Desktop process exposes a loopback local agent

While the desktop application process is running, it MUST start a same-machine HTTP agent on a loopback address that exposes health and application capability endpoints for browser sessions on that machine.

#### Scenario: Browser can probe local agent health

- **WHEN** the desktop application has started successfully
- **THEN** a same-machine browser can request the agent health endpoint over a loopback address and receive a successful response

#### Scenario: Agent is unavailable when desktop is not running

- **WHEN** the desktop application is not running or the loopback agent could not be started
- **THEN** browser clients do not receive sample data from a mock fallback
- **AND** they can classify the local agent as unavailable from request failures

### Requirement: Browser uses the local agent instead of implicit mock state

When the frontend is running outside Tauri in product mode, it MUST read bootstrap, settings, authorization, knowledge-tree, task, preview, and sync-metadata capabilities from the local agent instead of from browser-only `localStorage` or seeded demo data. Fixture behavior MAY remain available only through an explicit developer-only switch.

#### Scenario: Browser bootstrap reflects real persisted state

- **WHEN** a same-machine browser loads the app while the desktop local agent is reachable
- **THEN** the browser bootstrap response reflects the real saved settings, signed-in user state, connection validation, and discovered knowledge spaces from the shared desktop persistence

#### Scenario: Browser task list reflects shared persisted tasks

- **WHEN** sync tasks already exist in the shared local task store
- **THEN** a same-machine browser reads those same tasks from the local agent rather than creating a separate browser-only task list

### Requirement: Browser authorization is completed through the local agent

The browser runtime MUST use a real OAuth code flow in which authorization starts from the local agent and the returned code is exchanged through the local agent so that the resulting user session is stored in the same backend-owned session persistence used by the desktop runtime.

#### Scenario: Browser login produces shared session

- **WHEN** a browser user completes the authorization redirect flow successfully
- **THEN** the local agent exchanges the returned code, persists the signed-in user session, and returns a real authorization result to the browser
- **AND** a later desktop bootstrap reads the same signed-in user state without requiring a second login

### Requirement: Browser task updates are observed from backend state

The browser runtime MUST observe task progress and completion from shared backend task state instead of simulated browser timers.

#### Scenario: Browser detects task progress from persisted backend task state

- **WHEN** a sync task progresses after being started from either the desktop UI or the browser UI
- **THEN** the browser task views refresh from local-agent responses and reflect the shared task status and progress updates
