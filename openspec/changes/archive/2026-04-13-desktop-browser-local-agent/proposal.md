## Why

Browser mode still pretends to be usable by reading `localStorage`, seeding default knowledge spaces, and simulating authorization and task progress. That makes the browser experience diverge from the desktop app's real persisted state and hides whether the same machine can actually use the desktop backend from a normal browser session.

## What Changes

- Add an embedded localhost HTTP agent that starts with the desktop process and exposes the same-machine browser to real bootstrap, settings, authorization, knowledge-tree, task, preview, and sync-metadata endpoints backed by the desktop app's existing persisted state.
- Replace the browser runtime's implicit `localStorage`/sample-data fallback with a transport selector that prefers the local agent and only allows fixture data behind an explicit developer flag.
- Replace the browser-only mock authorization flow with a real browser redirect-and-return flow that exchanges the code through the local agent and stores the resulting shared local session.
- Provide a polling-based browser task bridge so task status updates come from persisted backend task state instead of browser-only timers, while keeping the existing event-driven desktop flow.
- Reduce business-level component branching by routing runtime-sensitive operations through a unified frontend client surface instead of having pages decide between desktop and browser behavior themselves.

## Capabilities

### New Capabilities
- `localhost-browser-agent-bridge`: Same-machine browser sessions can use a desktop-started localhost agent for real app bootstrap, auth, knowledge-tree, and task state instead of mock browser-only data.

### Modified Capabilities
- `tauri-desktop-runtime-and-backend`: The desktop backend also serves a loopback HTTP transport that reuses the same persisted settings, session, sync metadata, and task orchestration state as the Tauri commands.
- `sync-focused-application-experience`: Browser-hosted sessions use a real local-agent-backed flow or an explicit unavailable state, and no longer fabricate sample spaces, user state, or task progress by default.

## Impact

- Frontend runtime selection and API helpers in `src/utils/tauriRuntime.ts` plus page logic in `src/App.tsx`, `src/components/AuthPage.tsx`, `src/components/HomePage.tsx`, and `src/components/MarkdownPreviewPane.tsx`
- Existing browser fixture logic in `src/utils/browserTaskManager.ts`
- Native backend startup and HTTP transport wiring in `src-tauri/src/lib.rs` with a new local-agent module and additional Rust HTTP/CORS dependencies
- Shared desktop persistence paths for settings, user session, tasks, preview reads, sync metadata, and task state observation
