## ADDED Requirements

### Requirement: Embedded loopback backend transport shares desktop state

The desktop backend MUST expose a loopback HTTP transport that reuses the same persisted settings, backend-owned user session, sync metadata, and task orchestration state as the existing Tauri command surface. The loopback transport MUST NOT maintain a separate browser-only copy of those records.

#### Scenario: Browser reads the same saved settings and session state

- **WHEN** the desktop runtime has already persisted application settings or a signed-in user session
- **THEN** a same-machine browser request routed through the embedded loopback transport reads that same persisted state

#### Scenario: Browser-created task is visible to desktop task views

- **WHEN** a same-machine browser creates, starts, retries, resumes, or deletes a sync task through the loopback transport
- **THEN** the desktop runtime observes the same task-state changes through its normal task list and persistence flow
