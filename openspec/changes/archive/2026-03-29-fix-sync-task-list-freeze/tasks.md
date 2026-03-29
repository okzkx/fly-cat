# Tasks: fix-sync-task-list-freeze

## Implementation

- [x] 1. Update `TaskListPageProps` in `src/types/app.ts` to accept optional `initialTasks: SyncTask[]`
- [x] 2. Update `TaskListPage` component to use `initialTasks` for initial state instead of starting empty
- [x] 3. In `App.tsx`, pass `tasks` to `TaskListPage` as `initialTasks` prop
- [x] 4. In `App.tsx` `onCreateTask`, remove `await` from `startSyncTask` (fire-and-forget) and move `setTasks` refresh before the sync start call
