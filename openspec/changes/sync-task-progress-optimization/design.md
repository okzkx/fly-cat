# Design: sync-task-progress-optimization

## Problem Analysis

### Current Flow
1. User clicks "开始同步" → `createSyncTask()` is called
2. `create_sync_task` Tauri command runs `discover_documents_from_sources()` via `tokio::task::spawn_blocking`
3. **Document discovery blocks the command** (many HTTP calls to enumerate all documents)
4. Task is created with `counters.total` set from discovery results → returned to frontend
5. Frontend calls `startSyncTask(task.id)` (fire-and-forget)
6. `start_sync_task` sets status to "syncing" → calls `spawn_sync_progress`
7. **`spawn_sync_progress` re-discovers all documents from scratch** (duplicate work)
8. Documents are processed in chunks of 8 (concurrency)
9. **Progress event emitted once per chunk** (not per document)

### Issues
- **Issue 1**: Task appears slowly because discovery blocks `create_sync_task`
- **Issue 2**: Discovery runs twice (once in create, once in spawn_sync)
- **Issue 3**: Progress events batched per 8 documents instead of per document
- **Issue 4**: No "discovering" status shown to the user

## Design

### Change 1: Immediate task creation without discovery

`create_sync_task` should create the task immediately with `counters.total = 0` and return it, without performing document discovery. The `lifecycle_state` should be set to `"pending"`.

**Before**:
```rust
// create_sync_task does discovery synchronously
let discovered_documents = tokio::task::spawn_blocking(...).await??;
let total = discovered_documents.len().max(1) as u32;
// creates task with total known
```

**After**:
```rust
// create_sync_task returns immediately
let task = SyncTask {
    counters: SyncCounters {
        total: 0,  // not yet known
        processed: 0,
        succeeded: 0,
        skipped: 0,
        failed: 0,
    },
    lifecycle_state: "pending".into(),
    ...
};
```

### Change 2: Discovery phase with "discovering" lifecycle state

In `spawn_sync_progress`, before downloading, set the task status to `"syncing"` with `lifecycle_state = "discovering"` and emit an event. After discovery completes, update `counters.total` and set `lifecycle_state = "syncing"`, then emit another event.

**New lifecycle flow**:
```
pending → discovering → syncing → completed/partial-failed
```

### Change 3: Per-document progress events

Move `emit_task_event` from after each chunk to after each individual document. This ensures the frontend updates after every document is downloaded.

**Before** (line ~2182):
```rust
// After all documents in a chunk
{
    let state = app.state::<AppState>();
    if let Some(task) = tasks.iter().find(|task| task.id == task_id) {
        emit_task_event(&app, "sync-progress", task);
    }
}
```

**After**: emit per document inside the inner loop (line ~2140-2180), right after updating counters.

### Change 4: Frontend discovery state display

In `TaskListPage.tsx`, add a "discovering" status label (e.g., "发现文档中...") when `lifecycle_state === "discovering"`. During this phase, show the progress bar in an indeterminate state and display a text like "正在发现文档..." instead of counters.

### Change 5: Remove redundant discovery in create_sync_task

Remove the `tokio::task::spawn_blocking(discover_documents_from_sources(...))` call from `create_sync_task`. Document discovery only happens in `spawn_sync_progress`.

## File Impact

| File | Change |
|------|--------|
| `src-tauri/src/commands.rs` | Remove discovery from `create_sync_task`; add discovery lifecycle state in `spawn_sync_progress`; emit progress per document |
| `src/components/TaskListPage.tsx` | Handle "discovering" lifecycle state; indeterminate progress during discovery |
| `src/types/app.ts` | (likely no change needed - lifecycle_state is already a string field) |

## Risks

- **Race condition**: If the user navigates to task list before discovery completes, `counters.total` will be 0. Mitigated by showing "discovering" status.
- **Backward compatibility**: Existing tasks in storage may have `lifecycle_state` values that don't include "discovering". This is safe since we use string matching.
