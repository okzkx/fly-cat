## Why

Bulk **强制更新** already deletes local outputs early in its flow, but the Home page does not reflect that change until the later freshness and task-creation steps finish. Users therefore see only the button spinner while local files disappear on disk, which makes the action look broken and hides the queued follow-up sync.

## What Changes

- Reorder the Home page **强制更新** flow so stripped documents refresh to `未同步` in the UI immediately after local cleanup succeeds.
- Surface the follow-up sync task in the home task summary and task list as soon as it is queued, instead of waiting for the metadata-refresh phase to finish.
- Keep just-stripped documents visually `未同步` while the queued task is still waiting to start, then allow normal syncing badges once the task actually begins.
- Clean up any queued force-update task if a later freshness or startup step fails, so the task list does not retain a misleading pending entry.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `knowledge-tree-display`: **强制更新** must immediately clear synced presentation after local strip, and its follow-up sync task must become visible as soon as it is queued.

## Impact

- `src/components/HomePage.tsx`
- `src/App.tsx`
- `src/types/app.ts`
- `openspec/changes/fix-force-update-ui-state-sync/specs/knowledge-tree-display/spec.md`
