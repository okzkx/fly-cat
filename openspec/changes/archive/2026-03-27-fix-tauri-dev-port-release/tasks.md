## 1. Tauri Wrapper Runtime

- [x] 1.1 Replace the Windows-incompatible Tauri CLI spawn path with a cross-platform invocation that works in the wrapper script
- [x] 1.2 Add wrapper shutdown cleanup that removes the temporary override file and terminates the dev process tree started by the wrapper

## 2. Validation

- [x] 2.1 Add automated tests for command resolution and cleanup behavior in `scripts/run-tauri.mjs`
- [x] 2.2 Run the targeted test command and `openspec validate --change "fix-tauri-dev-port-release"`
