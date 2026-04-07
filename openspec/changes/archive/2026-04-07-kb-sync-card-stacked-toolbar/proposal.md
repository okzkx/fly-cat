## Why

The knowledge base sync card and the task list card still feel cramped because Ant Design places the Card `title` and `extra` action cluster on a single header row. Users perceive the right-side buttons as competing with the title and primary navigation affordances on the same baseline, which looks busy and hard to scan.

## What Changes

- Lay out the main sync workspace Card so the page title and task-list entry sit on their own header row, with the sync-related action buttons on a separate row below (not sharing the same horizontal band as the title).
- Apply the same stacked header pattern to the task list Card so its title and its management actions (clear all, back) are not on one line.

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `sync-focused-application-experience`: Extend layout expectations so primary Card toolbars are visually separated from titles on the home sync workspace and task list screens.

## Impact

- Frontend: `src/components/HomePage.tsx`, `src/components/TaskListPage.tsx` (Card `styles` / header layout only).
