## ADDED Requirements

### Requirement: Sync workspace Card header does not obscure title or task list

The application SHALL lay out the primary knowledge base synchronization Card header so that the visible page title (“飞猫助手知识库同步”), the task-list entry control, and the right-side action cluster (for example refresh, force update, batch delete, and start sync) do not overlap each other at typical desktop widths. When horizontal space is constrained, the UI SHALL wrap or reflow header content so the title and task-list entry remain readable and activatable rather than being clipped or covered by the action cluster.

#### Scenario: Desktop width with full action cluster

- **WHEN** the user views the authenticated home sync workspace at a typical desktop window width with all header actions visible
- **THEN** the page title text and the task-list control remain fully visible and clickable and are not covered by the right-side action buttons

#### Scenario: Narrow window

- **WHEN** the user narrows the application window so the header would not fit on one line
- **THEN** the header content reflows (for example by wrapping) such that the title and task-list control remain usable and are not obscured by the action cluster
