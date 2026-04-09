## Context

The app currently exposes two different ways to move a task from pending to active:

- The main Home page create-and-start flow creates a task and then calls `startSyncTask()` without awaiting it.
- The task list page uses a per-row start button for pending tasks, but that button routes through `resumeSyncTasks()` instead of directly starting the selected task.

This split makes the UI inconsistent. A start failure in the main flow can be lost, leaving the task in `pending` while the UI reports success. A pending task on the task list also does not use the most direct execution path, which makes the user action less predictable.

## Goals / Non-Goals

**Goals:**

- Use one direct start path for user actions that mean "start this task now".
- Surface start failures back to the initiating UI so success messages are only shown after the task actually begins.
- Keep the change minimal and avoid altering backend task execution semantics.

**Non-Goals:**

- Redesign task queuing or background execution behavior.
- Change batch resume semantics for flows that intentionally start multiple pending tasks.
- Refactor the Tauri backend task lifecycle.

## Decisions

### Await direct start after task creation

The Home page create-and-start flow will await `startSyncTask(task.id)` when `startImmediately` is enabled.

Why:

- It makes the success path truthful: the UI reports success only after the start request succeeds.
- It preserves the existing immediate task insertion behavior because the task is still added to local state before the start call.
- It avoids backend changes while fixing the user-visible stuck-in-pending failure mode.

Alternative considered:

- Keep fire-and-forget and rely on later event updates. Rejected because it is the source of the silent failure behavior.

### Use direct single-task start from the task list row action

The pending row action in `TaskListPage` will call `startSyncTask(record.id)` instead of `resumeSyncTasks()`.

Why:

- The row action semantically targets one task, so it should invoke the single-task command.
- It avoids surprising side effects on other pending tasks.
- It aligns retry/resync entry points with a shared direct-start model.

Alternative considered:

- Keep calling batch resume for convenience. Rejected because it weakens the guarantee that clicking one task's start control starts that exact task.

### Cover the behavior with focused unit tests

Add targeted tests around:

- create-and-start awaiting the direct start call
- the task list pending action selecting the single-task start path

Why:

- The regression is caused by UI orchestration, so focused frontend tests provide the highest signal for the least added surface area.

## Risks / Trade-offs

- [Task creation feels marginally less asynchronous] -> Mitigation: the task is still inserted into UI state immediately before awaiting the start request.
- [Existing spec text currently codifies fire-and-forget] -> Mitigation: update the delta spec in the same change so implementation and contract stay aligned.
- [The task list still keeps a separate batch-resume control] -> Mitigation: keep it for explicit "start all waiting tasks" behavior, while making row-level starts direct and predictable.
