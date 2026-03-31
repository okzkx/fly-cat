## Why

Users who accumulate many historical sync runs need a single action to reset the task list without deleting tasks one by one. A dedicated control on the task list page reduces friction and keeps the workspace tidy.

## What Changes

- Add a **清空所有同步任务** control on the sync task list page with explicit confirmation.
- Persist the empty task list in both Tauri (disk-backed store) and browser dev paths by introducing a **clear all** API parallel to single-task delete.
- Clear in-memory running-task tracking on the Rust side so new syncs are not blocked after a bulk clear.

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `sync-focused-application-experience`: Extend task-list behavior so users can remove every stored sync task in one confirmed action, with consistent behavior in desktop and browser runtimes.

## Impact

- Frontend: `TaskListPage`, task manager / `tauriRuntime` exports.
- Backend: new Tauri command registered in `lib.rs`, implementation next to `delete_sync_task`.
- Browser mock: `browserTaskManager` clears timers and local storage.
