# Proposal: fix-sync-task-list-freeze

## Problem

When the user clicks "开始同步" on HomePage and then navigates to the task list page, the page appears frozen for several seconds before showing the in-progress task. The expected behavior (matching the reference project `feishu_docs_export`) is to immediately display the task.

### Root Cause

In `App.tsx` `onCreateTask` (line 310-321), three operations are sequentially awaited:

1. `await createSyncTask(...)` — async Tauri command that runs `discover_documents_from_sources` via `spawn_blocking`, making N HTTP calls to discover all documents. This can take several seconds.
2. `await startSyncTask(task.id)` — Waits for backend to confirm task started.
3. `setTasks(await getSyncTasks())` — Another backend round-trip.

The UI is blocked at step 1 for the entire document discovery duration. During this time, the user cannot see any task in the task list.

### Reference Project Behavior

The reference project (`feishu_docs_export`) uses a different pattern:

1. `createDownloadTask` only saves to local storage (fast, no HTTP calls)
2. `startDownloadTask(newtask.id!)` is called **without** `await` (fire-and-forget)
3. TaskListPage loads tasks immediately from local state
4. Document discovery happens in the background during download

## Solution

Follow the reference project's pattern to make the UI responsive:

1. **Remove `await` from `startSyncTask`** in `App.tsx` `onCreateTask` — fire-and-forget, matching the reference project's `startDownloadTask(newtask.id!)`.
2. **Pass `tasks` from App to TaskListPage** as initial data via props, so the task list can immediately display tasks without waiting for a backend round-trip on mount.
3. **Move `setTasks` refresh before `startSyncTask`** so the task list in App state is updated immediately after task creation, before the fire-and-forget sync start.

## Scope

- `src/App.tsx`: Modify `onCreateTask` to not await `startSyncTask`, refresh tasks immediately after creation
- `src/App.tsx`: Pass `tasks` prop to `TaskListPage`
- `src/components/TaskListPage.tsx`: Accept and use `initialTasks` prop for immediate display
- `src/types/app.ts`: Update `TaskListPageProps` to include optional `initialTasks`

## Affected Specs

- `sync-focused-application-experience`: Task list page will show tasks immediately instead of freezing
