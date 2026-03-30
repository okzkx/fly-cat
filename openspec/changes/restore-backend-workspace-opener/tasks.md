## 1. Backend opener path

- [x] 1.1 Add a Rust `open_workspace_folder` command that opens local paths through the backend opener API.
- [x] 1.2 Register the new command in the Tauri invoke handler.

## 2. Frontend integration

- [x] 2.1 Update `openWorkspaceFolder(...)` to call the backend command in Tauri mode while preserving the current result shape.
- [x] 2.2 Keep existing HomePage directory-open feedback behavior unchanged.

## 3. Validation

- [x] 3.1 Run OpenSpec validation after implementation.
- [x] 3.2 Run a backend build verification to confirm the new command compiles.
