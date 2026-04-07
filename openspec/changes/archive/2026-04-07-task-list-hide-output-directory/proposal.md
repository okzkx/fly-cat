## Why

The sync task list currently shows each task's local output directory as a dedicated table column and again in expanded row details. This clutters the list without adding value for day-to-day monitoring; users already choose the output location when creating a sync. Hiding it keeps the task list focused on scope, progress, and status.

## What Changes

- Remove the "输出目录" column from the 飞猫助手 task list table.
- Remove the output directory line from expandable row details on that page.
- No change to where output paths are configured or stored; settings and sync creation flows remain as they are.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `sync-focused-application-experience`: Clarify that the dedicated task list page does not surface per-task output directory paths in the table or expanded details.

## Impact

- Frontend: `src/components/TaskListPage.tsx` (column list and `expandedRowRender`).
