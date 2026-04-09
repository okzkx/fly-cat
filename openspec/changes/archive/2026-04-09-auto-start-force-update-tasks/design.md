## Context

`HomePage` force-update currently creates a pending replacement task early so the task summary and task list can reflect that work is queued before the shared freshness refresh finishes. After the metadata phase completes, the page tries to start that queued task through a separate single-task callback. Users report that the queued task can still require the manual `开始等待任务` action, which means the automatic follow-up path is not aligned with the task-list resume path.

## Goals / Non-Goals

**Goals:**

- Preserve the existing early visibility of force-update replacement tasks.
- Make the normal successful force-update path automatically start the queued replacement task.
- Reuse the same pending-task resume pathway that the task list already exposes manually.

**Non-Goals:**

- Removing the manual resume controls that remain useful for recovery after reloads or interrupted runs.
- Redesigning task lifecycle states or adding a new queued/preparing status.
- Changing non-force-update freshness flows.

## Decisions

Use the existing `resumeSyncTasks()` path after a successful force-update metadata phase instead of starting the queued task through a separate per-task callback.

Rationale:

- The user-facing manual recovery action already resumes pending tasks through `resumeSyncTasks()`, so reusing it keeps automatic and manual behavior consistent.
- Force-update already blocks execution whenever any task is `pending` or `syncing`, so after a successful queue operation the only resumable pending task should be the newly queued replacement task.
- This preserves the earlier change that surfaces the pending task immediately while removing the extra requirement that the user visit the task list and click start.

Also update the standard home-page task creation path to start work as fire-and-forget once the task is inserted into UI state, matching the existing task-list visibility requirement.

## Risks / Trade-offs

- [Resuming all pending tasks could start more than the newly queued task] -> Force-update already refuses to run when any task is pending or syncing, so the successful path still only has one pending replacement task to resume.
- [Fire-and-forget start can hide immediate transport errors from the create-task promise] -> The created task still appears instantly, and runtime task events remain the source of truth for progress/failure feedback.
