## MODIFIED Requirements

### Requirement: Task List Displays Immediately After Sync Start

The system MUST display the newly created sync task in the task list page immediately when the user navigates to it after clicking "开始同步", without freezing or appearing empty. The create-and-start flow MUST add the task to local UI state before sending the start request, MUST then directly invoke `startSyncTask` for that new task, and MUST await the result before reporting a successful start to the user. If the direct start request fails, the initiating flow MUST surface the error instead of claiming the task already started. TaskListPage MUST accept initial tasks via props to avoid an empty initial render, and the row-level pending-task start control MUST directly start the selected task instead of routing through the batch resume action.

#### Scenario: User creates sync task and navigates to task list

- **WHEN** the user is on the HomePage with a valid selection and clicks "开始同步"
- **THEN** the application inserts the created task into local state immediately
- **AND** the task list page shows the newly created task immediately after navigation
- **AND** the application directly starts that task and updates the status to "syncing" or discovery-in-progress via event-driven updates

#### Scenario: Direct start failure is surfaced after task creation

- **WHEN** the application successfully creates a sync task but the subsequent direct `startSyncTask` request fails
- **THEN** the initiating UI surfaces the start failure to the user
- **AND** the application does not report that the task already started successfully
- **AND** the created task remains available in the task list for a later retry

#### Scenario: Pending row action starts the selected task directly

- **WHEN** the user clicks the start control for a pending task in the task list
- **THEN** the UI invokes the direct single-task start action for that task
- **AND** the action does not depend on the batch resume path for other waiting tasks
