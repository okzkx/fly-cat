## 1. Tauri Foundation

- [x] 1.1 Rebuild the project into a real Tauri desktop structure by adding `src-tauri`, Tauri scripts, and config files aligned with `./feishu_docs_export`.
- [x] 1.2 Port the reference project's essential frontend and Tauri plugin dependencies (`@tauri-apps/api`, CLI, dialog/fs/http/opener/shell/oauth/sql plugins where needed) and make `npm run tauri dev` the primary development entrypoint.
- [x] 1.3 Define the frontend/backend contract for sync commands and events so long-running sync work no longer depends on browser-only mocks or localStorage-only runtime behavior.

## 2. Reference Shell Alignment

- [x] 2.1 Rebuild the top-level app shell to match the reference project's Tauri + Ant Design layout, header, and page-switching structure.
- [x] 2.2 Restore the reference-style page decomposition (`SettingsPage`, `AuthPage`, `HomePage`, `TaskListPage`) and adapt each page from export semantics to sync semantics.
- [x] 2.3 Reintroduce the reference project's configuration guidance and dedicated auth flow, replacing export-related scope/help text with sync and MCP-oriented guidance.
- [x] 2.4 Replace temporary/mock auth and task behaviors with Tauri-backed flows while preserving the same user-facing interaction rhythm as the reference project.

## 3. Backend Sync Orchestration

- [x] 3.1 Implement Rust-side sync commands that discover selected knowledge base documents and start synchronization tasks from the backend.
- [x] 3.2 Implement backend-owned task persistence and state restoration so sync tasks survive app refresh/restart in a reference-style task model.
- [x] 3.3 Emit Tauri events for sync progress, completion, partial failure, and retry/resume updates, and wire frontend listeners to them.

## 4. MCP Content Pipeline

- [x] 4.1 Implement MCP client integration in the backend for Feishu knowledge base content retrieval with validation and retry boundaries.
- [x] 4.2 Build a canonical intermediate document model decoupled from raw Feishu API payload structure.
- [x] 4.3 Implement deterministic Markdown rendering and stable local path mapping from backend-owned sync services.
- [x] 4.4 Persist manifest metadata needed for incremental synchronization, retries, and rename/move handling.

## 5. Image Handling

- [x] 5.1 Implement remote-first image resolution in the backend and keep valid remote URLs in generated Markdown.
- [x] 5.2 Implement fallback image download with hashed filenames written to a fixed assets subdirectory under the sync root.
- [x] 5.3 Rewrite Markdown image references to local relative asset paths when fallback storage is required.
- [x] 5.4 Deduplicate downloaded assets by content hash across sync runs.

## 6. UX and Task Experience

- [x] 6.1 Implement sync-oriented home-page actions for selecting knowledge base scopes and creating synchronization tasks.
- [x] 6.2 Implement task list views showing run-level and document-level progress, status, retry, and resume actions.
- [x] 6.3 Surface actionable sync error feedback in the UI, including failed-item diagnostics and recovery entry points.

## 7. Validation and Rollout

- [x] 7.1 Add automated tests for incremental planning, Markdown output, image fallback behavior, and backend task-state recovery.
- [x] 7.2 Run the app through `npm run tauri dev` and verify the desktop shell, page flow, and frontend/backend event wiring work end-to-end.
- [ ] 7.3 Run a controlled knowledge base sync against real MCP/Feishu context and verify repeated-run path stability plus retry behavior.
