## ADDED Requirements

### Requirement: Browser same-machine mode reports agent availability honestly

When the application is running outside the Tauri desktop runtime, product behavior MUST either use the same-machine local agent successfully or present an explicit unavailable state. It MUST NOT pretend to be connected by seeding default knowledge spaces, fake signed-in users, or simulated task progress from browser-only storage unless an explicit developer fixture mode is enabled.

#### Scenario: Browser cannot reach the local agent

- **WHEN** a browser session starts and the same-machine local agent is unreachable
- **THEN** the auth and bootstrap experience shows a request-failed or unavailable state with actionable guidance to start the desktop app
- **AND** the UI does not render seeded knowledge spaces or simulated task records as if they were real data

#### Scenario: Browser with reachable local agent but no signed-in user

- **WHEN** a browser session can reach the local agent and valid app settings exist but no signed-in user session is stored
- **THEN** the user is directed to the dedicated auth page with a real authorization entry point rather than a mock login action
