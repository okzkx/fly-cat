# Proposal: fix-port-occupation

## Summary

Thoroughly fix the port occupation issue that occurs when the Tauri dev app is force-closed and then restarted. The previous fix (setting `strictPort: false`) was incomplete -- it only allows Vite to pick a different port but doesn't address root cause: orphaned child processes holding the port.

## Motivation

When the app is force-closed (Task Manager, closing console window directly, `taskkill /F`), none of the signal handlers (SIGINT/SIGTERM/SIGBREAK) in `run-tauri.mjs` fire. The Vite dev server and Tauri CLI child processes become orphaned and continue holding port 1430. On the next launch, `findAvailablePort` discovers the port is taken and picks a different one -- but the old orphaned processes pile up and eventually exhaust the port range (1430-1449).

## Goals

1. Ensure orphaned child processes from a previous session are detected and killed on startup
2. Keep `strictPort: false` as a safety net for fallback
3. The `findAvailablePort` mechanism already works well -- augment it with orphan cleanup

## Approach

Add a startup cleanup step in `run-tauri.mjs` that:
1. Probes the preferred dev port range (1430-1449)
2. For any occupied port, attempts to identify the process holding it (via `netstat` on Windows)
3. Kills any leftover Node/Vite/Tauri processes from previous dev sessions before starting a new one

This is the most robust approach because:
- It handles ALL force-close scenarios (Task Manager, crash, power loss recovery)
- It doesn't rely on signal handlers that may never fire
- It runs BEFORE the new dev server starts, guaranteeing port availability

## Capabilities

- Port auto-discovery (existing)
- Orphaned process cleanup on startup (new)
- Port fallback via `strictPort: false` (existing safety net)

## Impact

- **scripts/run-tauri.mjs**: Add `killOrphanedDevProcesses()` function and call it in `runDev()`
- **vite.config.ts**: No further changes needed (`strictPort: false` already applied)
- **Development experience**: Reliable restart after force-close

## Affected Code

- `scripts/run-tauri.mjs`

## Dependencies

- No external dependencies (uses Node.js built-in `child_process`)

## Systems

- Frontend dev server (Vite)
- Development startup script

## API Changes

- No API changes

## Implementation Details

On Windows, use `netstat -ano` to find PIDs occupying ports in the dev range. Cross-reference with `tasklist` to confirm they are Node.js processes. Kill them with `taskkill /PID <pid> /T /F` before starting the new dev session.

## Testing Notes

- Manual test: Start dev server, force-kill via Task Manager, restart -- should use same port (1430)
- Manual test: Start multiple dev sessions and verify port cleanup
- Run existing unit tests

## Risks

- Low risk: only affects dev startup flow
- If a non-dev process is on the same port, it would be incorrectly killed -- mitigated by checking process name via `tasklist`

## Alternatives Considered

1. `strictPort: false` only (previous fix -- incomplete)
2. Windows-specific signal handlers (don't fire on force-kill)
3. PID file tracking (PID files become stale after force-kill)
4. Port range configuration (doesn't solve root cause)

## Decision

Adopt orphan cleanup approach: kill leftover Node/Vite/Tauri processes in the dev port range before starting a new session. This is the most robust solution that handles all force-close scenarios.

## Tasks

- [ ] Add `killOrphanedDevProcesses()` to `run-tauri.mjs`
- [ ] Call orphan cleanup in `runDev()` before `findAvailablePort`
- [ ] Run unit tests to verify existing functionality is preserved
- [ ] Manual verification of force-close restart scenario
