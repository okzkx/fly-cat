# Tasks

## 1. Remove document discovery from create_sync_task [completed]
Remove the `tokio::task::spawn_blocking(discover_documents_from_sources(...))` call from `create_sync_task`. Create the task with `counters.total = 0` and `lifecycle_state = "pending"` immediately. Keep the `selection_summary` based on the selected sources only.

## 2. Add discovery lifecycle state in spawn_sync_progress [completed]
In `start_sync_task`, set `lifecycle_state` to `"discovering"` instead of `"syncing"`. In `spawn_sync_progress`, after discovery completes and counters are updated, set `lifecycle_state` to `"syncing"` and emit a `sync-progress` event.

## 3. Emit progress events per document instead of per chunk [completed]
Move the `emit_task_event(&app, "sync-progress", task)` call from after each chunk loop to inside the inner loop, right after updating each individual document's counters. Also batch disk saves to every `manifest_batch_size` documents to reduce I/O.

## 4. Update TaskListPage to handle discovering state [completed]
In `TaskListPage.tsx`, update `statusToTag` to accept `lifecycleState` and show "发现文档中" tag. Update progress column to show active indeterminate progress bar during discovery. Update statistics column to show "正在发现文档..." during discovery.

## 5. Update sync-focused-application-experience spec [completed]
Add scenarios for discovery-phase lifecycle state visibility to the delta spec.
