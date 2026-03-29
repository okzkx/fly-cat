## 1. Backend: Serial Document Processing

- [x] 1.1 Change `concurrency` from 8 to 1 in `spawn_sync_progress` in `src-tauri/src/commands.rs`
- [x] 1.2 Remove `std::thread::scope` and parallel chunk processing; replace with a simple sequential loop over `queued_documents`
- [x] 1.3 Ensure per-document `emit_task_event` call is preserved after each document completes

## 2. Frontend: Total Count Display

- [x] 2.1 In `src/components/TaskListPage.tsx`, add "已处理 X / 共 Y" line above existing success/skip/failure counters in the "统计" column
- [x] 2.2 In `src/utils/browserTaskManager.ts`, update the simulated progress display to match the new format (if applicable)

## 3. Validation

- [x] 3.1 Run `openspec validate` to confirm change passes
