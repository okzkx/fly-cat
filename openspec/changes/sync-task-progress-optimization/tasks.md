# Tasks

## 1. Remove document discovery from create_sync_task
Remove the `tokio::task::spawn_blocking(discover_documents_from_sources(...))` call from `create_sync_task`. Create the task with `counters.total = 0` and `lifecycle_state = "pending"` immediately. Keep the `selection_summary` based on the selected sources only.

## 2. Add discovery lifecycle state in spawn_sync_progress
In `spawn_sync_progress`, before the existing discovery call, set the task's `status` to `"syncing"` and `lifecycle_state` to `"discovering"`, then emit a `sync-status-changed` event. After discovery completes and before downloading starts, update `counters.total` and set `lifecycle_state` to `"syncing"`, then emit a `sync-progress` event.

## 3. Emit progress events per document instead of per chunk
Move the `emit_task_event(&app, "sync-progress", task)` call from after each chunk loop to inside the inner loop, right after updating each individual document's counters. This ensures the frontend receives an update after every document download.

## 4. Update TaskListPage to handle discovering state
In `TaskListPage.tsx`, update the progress column to show an indeterminate progress bar with "正在发现文档..." text when `lifecycle_state === "discovering"`. Update `statusToTag` to handle the discovery phase.

## 5. Update sync-focused-application-experience spec
Add a scenario for discovery-phase lifecycle state visibility to the spec.
