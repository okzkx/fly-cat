## ADDED Requirements

### Requirement: Primary Card toolbars separated from titles

The application SHALL present the primary knowledge base synchronization Card and the sync task list Card such that the Card `extra` action cluster is laid out on a separate row below the title region, not on the same horizontal row as the Card title text at typical desktop widths. The title row MAY still include related inline affordances (such as the task-list entry beside the sync page title on the home workspace).

#### Scenario: Home sync card

- **WHEN** the user views the authenticated home sync workspace
- **THEN** the sync action buttons (for example refresh, force update, batch delete, start sync) appear below the title and task-summary row rather than to the right on the same line

#### Scenario: Task list card

- **WHEN** the user opens the sync task list view
- **THEN** the task management actions (for example clear all tasks, return home) appear below the "飞猫助手任务列表" title row rather than to the right on the same line
