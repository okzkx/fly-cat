## ADDED Requirements

### Requirement: Task list bulk clear

The application MUST provide a control on the dedicated sync task list page that removes every stored sync task in a single user-confirmed action. The action MUST persist an empty task list for both Tauri and browser runtimes and MUST clear any runtime bookkeeping that would block starting new sync tasks after the list is emptied.

#### Scenario: User clears all tasks from the task list

- **WHEN** the user opens the sync task list page and at least one task exists
- **THEN** the UI exposes a control whose label clearly indicates that all sync tasks will be removed
- **AND** the user MUST confirm the action before any tasks are deleted

#### Scenario: Empty list after bulk clear

- **WHEN** the user confirms bulk clear
- **THEN** the task list becomes empty immediately in the UI
- **AND** reloading the application or revisiting the task list still shows no tasks until new ones are created

#### Scenario: New sync can start after bulk clear

- **WHEN** the user had previously started a sync run and then performed a bulk clear
- **THEN** the user MUST still be able to create and start a new sync task without requiring an application restart
