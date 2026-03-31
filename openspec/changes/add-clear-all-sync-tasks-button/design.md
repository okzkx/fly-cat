## Context

The task list (`TaskListPage`) already supports per-row delete via `deleteSyncTask` and Tauri `delete_sync_task`. There is no bulk operation; users must confirm and delete each row.

## Goals / Non-Goals

**Goals:**

- One primary action on the task list header to remove every stored sync task after explicit confirmation.
- Same semantics in Tauri and browser dev mode (empty persisted list, no orphaned interval timers in browser).
- Rust: clear `AppState.tasks` and `running_task_ids` so the engine does not think old runs are still active.

**Non-Goals:**

- Cancelling in-flight network work inside `spawn_sync_progress` threads (background threads already no-op if the task row is gone; user accepts best-effort stop).
- Deleting synced Markdown files or manifests on disk.

## Decisions

- **Dedicated command vs loop delete**: Add `clear_all_sync_tasks` in Rust that clears the vector and `running_task_ids` in one transaction-style update and saves JSON once. Avoids N round-trips and matches single-delete persistence rules.
- **UI placement**: Put the button in the card `extra` area next to **返回首页**, with `Popconfirm` (same pattern as row delete).
- **Browser**: Implement `clearAllSyncTasks` that clears `runningTimers` and writes `[]` to local storage via existing `saveTasks`.

## Risks / Trade-offs

- **[Risk]** A sync thread may still run briefly after clear → **Mitigation**: It uses `find` by id; missing tasks skip updates; `running_task_ids` cleared so new `start_sync_task` is not blocked incorrectly.
- **[Risk]** User confuses clearing tasks with deleting files → **Mitigation**: Confirm copy states tasks only, not synced files.
