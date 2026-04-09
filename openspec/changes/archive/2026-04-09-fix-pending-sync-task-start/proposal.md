## Why

Sync tasks can remain in a pending/preparing state even after the user clicks a start control. The current flow mixes direct-start and batch-resume behavior, and the main create-and-start path does not wait for the actual start request, so users can be told a task started when it really did not.

## What Changes

- Make the primary create-and-start flow await the task start request so start failures are surfaced instead of being silently swallowed.
- Make the pending-task start control on the task list directly start the selected task instead of routing through the batch resume action.
- Update the task-start interaction spec so immediate task visibility and direct execution are both required behaviors.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `sync-focused-application-experience`: Sync task creation and task-list start controls must trigger direct task execution and surface start failures clearly.

## Impact

- Affected code: `src/App.tsx`, `src/components/TaskListPage.tsx`, and focused task-start tests.
- Affected behavior: sync task creation, pending-task start from the task list, and user-visible error handling when start requests fail.
- No new dependencies or backend API changes are required.
