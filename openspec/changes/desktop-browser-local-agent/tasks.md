## 1. Backend local agent

- [ ] 1.1 Add an embedded loopback local-agent server to the Tauri app startup path and expose health plus shared backend endpoints for bootstrap, settings, auth, spaces, tasks, preview, and sync metadata.
- [ ] 1.2 Reuse the desktop backend's persisted settings/session/task state through the local-agent handlers so browser and desktop flows observe the same local data.

## 2. Frontend transport and browser flow

- [ ] 2.1 Refactor the frontend runtime client so non-Tauri product mode uses the local agent by default and only allows fixture behavior behind an explicit developer switch.
- [ ] 2.2 Replace browser mock authorization and task updates with a real redirect/callback flow plus polling-backed task observation, and remove business-level browser mock branching from the main pages.

## 3. Validation

- [ ] 3.1 Run OpenSpec validation and targeted build/typecheck/lint checks for the changed frontend and Tauri code.
- [ ] 3.2 Verify that browser and desktop runtimes now share the same persisted bootstrap and task state, or document any remaining MVP gap that could not be fully validated in this run.
