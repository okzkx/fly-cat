# Delta: sync-focused-application-experience

## MODIFIED Requirements

### Requirement: Task list displays immediately after sync start

The system MUST display the newly created sync task in the task list page immediately when the user navigates to it after clicking "开始同步", without freezing or appearing empty.

- `startSyncTask` MUST be called as fire-and-forget (not awaited) after task creation
- TaskListPage MUST accept initial tasks via props to avoid an empty initial render
- App state MUST be refreshed immediately after task creation, before starting the sync

#### Scenario: User creates sync task and navigates to task list

- Given the user is on the HomePage with a valid selection
- When the user clicks "开始同步"
- And the user navigates to the task list page
- Then the task list page shows the newly created task immediately
- And the task status updates to "syncing" via event-driven updates
