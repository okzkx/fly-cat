## ADDED Requirements

### Requirement: Task list omits output directory display

The dedicated sync task list page (`飞猫助手任务列表`) MUST NOT show each task's local output directory as a table column or inside expandable row details. Per-task `outputPath` data MAY remain stored and used elsewhere.

#### Scenario: No output directory column

- **WHEN** the user opens the sync task list page and at least one task exists
- **THEN** the task table does not include a column whose purpose is to display the task output directory path

#### Scenario: Expanded details omit output directory

- **WHEN** the user expands a task row to view additional context
- **THEN** the expanded content does not include a line that displays the output directory path for that task
