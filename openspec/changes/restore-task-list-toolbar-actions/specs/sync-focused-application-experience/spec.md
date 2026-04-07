## MODIFIED Requirements

### Requirement: Task list header actions remain visible

The application MUST render the sync task list page card header so that **返回首页**, bulk task clearing, and a control to start all currently pending sync tasks are always visible and usable on typical desktop window sizes, without being clipped by the card header layout. The header MUST allow actions to wrap to additional lines when horizontal space is constrained.

#### Scenario: User opens task list after sync setup

- **WHEN** an authenticated user navigates to the task list view
- **THEN** the card header shows a clear page title together with **返回首页**, **清空所有任务** (when tasks exist), and **开始等待任务** (enabled when at least one task is pending), and none of these controls are clipped out of view solely due to header flex layout

#### Scenario: Narrow window

- **WHEN** the user resizes the application window to a narrower width
- **THEN** header actions remain reachable via wrapping or equivalent layout behavior rather than disappearing under overflow
