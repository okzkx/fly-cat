# Design: fix-port-occupation

## Context

The Tauri dev workflow starts a Vite dev server and a Tauri CLI child process via `scripts/run-tauri.mjs`. The script already has:
- `findAvailablePort()` to probe for a free port
- `terminateChildTree()` to kill child processes on graceful exit
- Signal handlers for SIGINT/SIGTERM/SIGBREAK
- `cleanupDevSession()` to remove temp files and terminate children

However, when the process is force-killed (Task Manager, `taskkill /F`, console window close), signal handlers don't fire. The orphaned Vite/Tauri processes keep port 1430 (and subsequent ports if multiple sessions were started) bound.

## Goals

1. Detect and kill orphaned dev processes before starting a new dev session
2. Preserve all existing cleanup mechanisms as defense-in-depth
3. No impact on production builds

## Non-Goals

1. No changes to production build behavior
2. No new external dependencies

## Decisions

### 1. Startup orphan cleanup (primary fix)

Before calling `findAvailablePort()`, scan the dev port range for occupied ports and kill any leftover Node.js processes.

**Rationale**: This is the only approach that works after force-kill, because:
- Signal handlers don't fire on force-kill
- PID files become stale
- The port is still held by the orphan

### 2. Implementation: netstat + tasklist + taskkill on Windows

Use Windows built-in commands:
1. `netstat -ano | findstr :<port>` to find the PID occupying a port
2. `tasklist /FI "PID eq <pid>" /FO CSV` to verify it's a Node.js process
3. `taskkill /PID <pid> /T /F` to kill the process tree

On non-Windows platforms, use `lsof -ti :<port>` instead.

### 3. Limit cleanup to dev port range only

Only scan ports in the range `[preferredDevPort, preferredDevPort + maxDevPortAttempts)`. This prevents accidentally killing unrelated processes.

### 4. Check process name before killing

Only kill processes whose name matches `node.exe` (Windows) or `node` (Unix). This prevents killing a legitimate application that happens to use the same port.

### 5. Keep strictPort: false as safety net

The existing `strictPort: false` in `vite.config.ts` provides a last-resort fallback if cleanup somehow fails.

## Technical Design

### New function: `killOrphanedDevProcesses()`

```typescript
async function killOrphanedDevProcesses(startPort, maxAttempts) {
  // For each port in the range:
  //   1. Probe if port is occupied
  //   2. If occupied, find the PID
  //   3. Verify the PID is a Node.js process
  //   4. Kill the process tree
}
```

### Modified flow in `runDev()`

```
Before: findAvailablePort -> start dev server
After:  killOrphanedDevProcesses -> findAvailablePort -> start dev server
```

### Error handling

- If orphan cleanup fails (e.g., permission denied), log a warning and proceed -- `findAvailablePort` will pick a different port
- If the process on the port is NOT a Node.js process, skip it and try the next port

## Risks / Trade-offs

- [Low] Killing wrong process -> mitigated by checking process name
- [Low] Race condition between cleanup and new server -> very unlikely in dev context
- [None] Production builds unaffected

## Migration Plan

1. Add `killOrphanedDevProcesses()` to `run-tauri.mjs`
2. Call it at the start of `runDev()`
3. Run existing tests
4. Manual verification
