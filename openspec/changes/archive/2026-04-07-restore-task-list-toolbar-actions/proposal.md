## Why

The task list card header used the same stacked `Card` `title` / `extra` styling as the home sync card. With Ant Design 6’s flex header layout, giving the title region `width: 100%` while `extra` stays in a horizontal `head-wrapper` can push the action area out of the visible/clipped region, so users lose **返回首页**, bulk actions, and perceive row-level controls as “gone”.

## What Changes

- Rework the task list page header so the title and toolbar actions share one responsive flex row (aligned with the home page card pattern), restoring visible **返回首页**, **清空所有任务**, and a primary control to start pending sync work from the list.
- Keep table row actions unchanged in behavior; ensure the card header no longer clips them visually by association.

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `sync-focused-application-experience`: Task list view MUST always expose navigation back to the primary workspace and task-level actions in the card header without clipping.

## Impact

- Frontend: `src/components/TaskListPage.tsx` (and optionally shared styling patterns only if needed).
