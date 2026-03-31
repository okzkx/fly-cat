## 1. Backend (Tauri)

- [ ] 1.1 Add `clear_all_sync_tasks` command: empty task vec, persist, clear `running_task_ids`
- [ ] 1.2 Register the command in `lib.rs`

## 2. Frontend runtime bridge

- [ ] 2.1 Add `clearAllSyncTasks` in `browserTaskManager` and `tauriRuntime`; export via `taskManager`

## 3. UI

- [ ] 3.1 Add confirmed **清空所有同步任务** control on `TaskListPage` card header (disabled when list empty)
