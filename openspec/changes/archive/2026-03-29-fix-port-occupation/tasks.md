# Tasks: fix-port-occupation

## Task 1: Add port owner PID finder
- Add `findPortOwnerPid(port, platform, spawnImpl)` to `scripts/run-tauri.mjs`
- On Windows: run `netstat -ano | findstr :<port>` and parse the PID from the last column
- On Unix: run `lsof -ti :<port>`
- Export the function for testing
- **File**: `scripts/run-tauri.mjs`

## Task 2: Add Node.js process verifier
- Add `isNodeProcess(pid, platform, spawnImpl)` to `scripts/run-tauri.mjs`
- On Windows: run `tasklist /FI "PID eq <pid>" /FO CSV` and check for `node.exe`
- On Unix: check `ps -p <pid> -o comm=` for `node`
- Export the function for testing
- **File**: `scripts/run-tauri.mjs`

## Task 3: Add orphaned dev process killer
- Add `killOrphanedDevProcesses(startPort, maxAttempts, options)` to `scripts/run-tauri.mjs`
- For each port in range, probe -> find PID -> verify -> kill
- Reuse existing `terminateChildTree` logic for actual killing
- Export the function for testing
- **File**: `scripts/run-tauri.mjs`

## Task 4: Integrate cleanup into runDev flow
- Call `killOrphanedDevProcesses(preferredDevPort, maxDevPortAttempts)` at start of `runDev()`
- Add a console.log message when orphaned processes are cleaned up
- **File**: `scripts/run-tauri.mjs`

## Task 5: Add unit tests
- Test `findPortOwnerPid` with mocked netstat/lsof output
- Test `isNodeProcess` with mocked tasklist/ps output
- Test `killOrphanedDevProcesses` end-to-end with mocked spawn
- Test that non-Node processes on the port are NOT killed
- Test that cleanup failure is non-blocking
- **File**: `tests/run-tauri.test.ts`

## Task 6: Run tests and verify
- Run `npm test` to verify all tests pass
- Verify existing tests still pass
