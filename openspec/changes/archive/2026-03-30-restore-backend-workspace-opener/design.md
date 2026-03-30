## Context

The current desktop implementation opens the workspace folder directly from the frontend with `@tauri-apps/plugin-opener`'s `openPath(...)`. That path still fails for some real user directories such as `C:/Users/.../Documents/synced-docs`, even after `opener:allow-open-path` was added. The repository history also indicates that workspace opening previously used a backend command, which better matches the "local OS action" nature of this feature.

## Goals / Non-Goals

**Goals:**
- Move workspace-folder opening back to a backend-owned command.
- Preserve the existing frontend return shape and error presentation.
- Support absolute sync-root paths in normal user directories.

**Non-Goals:**
- Change document/browser URL opening.
- Redesign the HomePage toolbar.
- Change sync-root resolution logic itself.

## Decisions

- Add a Rust command `open_workspace_folder` that uses the Tauri opener plugin from the backend via `OpenerExt`.
- Keep `openWorkspaceFolder(...)` in `tauriRuntime.ts` as the frontend wrapper, but route it through `invoke(...)` in Tauri mode.
- Leave browser-mode fallback untouched so non-Tauri development behavior stays predictable.

## Risks / Trade-offs

- [Backend opener API differs from frontend expectations] -> Preserve a simple `Result<(), String>` command and map it back to the existing `{ success, error? }` shape in TypeScript.
- [Platform-specific path-opening differences] -> Use the plugin's backend opener API rather than custom OS-specific shell logic.
