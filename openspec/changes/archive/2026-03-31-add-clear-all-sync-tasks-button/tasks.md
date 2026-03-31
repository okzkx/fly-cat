## 1. Backend (Tauri)

- [x] 1.1 Add `clear_all_sync_tasks` command: empty task vec, persist, clear `running_task_ids`
- [x] 1.2 Register the command in `lib.rs`

## 2. Frontend runtime bridge

- [x] 2.1 Add `clearAllSyncTasks` in `browserTaskManager` and `tauriRuntime`; export via `taskManager`

## 3. UI

- [x] 3.1 Add confirmed **清空所有同步任务** control on `TaskListPage` card header (disabled when list empty)
