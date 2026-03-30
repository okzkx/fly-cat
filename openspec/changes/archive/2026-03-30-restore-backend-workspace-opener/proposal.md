## Why

The "实际写入目录 -> 打开" action still fails for some absolute user directories with `Not allowed to open path ...` even though the frontend already has the opener permission declared. This means the current frontend `openPath(...)` route is still constrained by runtime permission checks and is not reliable for opening the user's real sync root.

## What Changes

- Restore workspace-folder opening as a backend-owned Tauri command instead of relying on the frontend opener call for local paths.
- Route the HomePage workspace-open action through that backend command while preserving user-friendly error handling.
- Keep browser-mode behavior unchanged and avoid affecting document/browser URL opening.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `tauri-desktop-runtime-and-backend`: opening the effective sync root must succeed through a backend-owned local-path opener flow, including absolute user directories outside the app bundle.

## Impact

- Affected code: `src/utils/tauriRuntime.ts`, `src/components/HomePage.tsx`, `src-tauri/src/commands.rs`, `src-tauri/src/lib.rs`
- Runtime behavior: local workspace-folder opening moves back to the Rust backend command path
- Validation: requires backend build verification to ensure the command and opener trait compile correctly
