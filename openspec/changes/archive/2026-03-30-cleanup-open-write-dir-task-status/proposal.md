## Why

The active TODO item for the "open actual write directory" error is stale. The underlying opener-permission fix is already present in the codebase and has already been archived, but the task still appears as the current P2 item and can trigger redundant work.

## What Changes

- Verify that the reported directory-opening failure is already resolved by the existing opener permission change.
- Remove the stale active item from `TODO.md` so the queue reflects the next real task.
- Preserve the existing completion evidence in `DONE.md` instead of creating duplicate completion records.

## Capabilities

### New Capabilities

- `task-queue-hygiene`: Define how cleanup-only task runs should clear stale active TODO items after completion has already been verified elsewhere.

### Modified Capabilities

None.

## Impact

- Affected files: `TODO.md`, OpenSpec change artifacts for this cleanup task
- Workflow impact: prevents already-completed fixes from remaining at the front of the active task queue
