## Why

Force-update currently creates a replacement sync task before the metadata refresh finishes, but the follow-up start step does not reliably match the manual "开始等待任务" path. In practice, users can end up with a pending task that still needs a manual click, which breaks the expected one-click force-update flow.

## What Changes

- Clarify that a force-update replacement task must enter the automatic start path after the metadata phase succeeds, without requiring the user to manually click "开始等待任务".
- Align the force-update follow-up start flow with the existing pending-task resume path that the task list already uses.
- Keep the existing early task visibility for force-update while removing the extra manual recovery step from the normal success path.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `knowledge-tree-display`: force-update follow-up tasks must auto-start after metadata work completes instead of relying on a separate manual task-list start action.

## Impact

- `src/components/HomePage.tsx`
- `src/App.tsx`
- `src/types/app.ts`
- Existing task start/resume wiring in `src/utils/taskManager`
