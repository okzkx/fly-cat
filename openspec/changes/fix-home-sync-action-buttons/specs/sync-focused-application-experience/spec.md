## ADDED Requirements

### Requirement: Home sync Card header actions stay within the visible header

The application MUST lay out the primary knowledge-base synchronization Card on the home workspace so that **开始同步**, **全部刷新**, **强制更新**, and **批量删除** render inside the visible card header bounds at typical desktop window widths. The layout MUST NOT rely on a single horizontal flex row that combines the title region and the full-width `extra` cluster in a way that clips or hides those actions due to overflow.

#### Scenario: Desktop home workspace shows all primary actions

- **WHEN** the authenticated user views the home knowledge-base sync workspace at a typical desktop width
- **THEN** **开始同步**, **全部刷新**, **强制更新**, and **批量删除** are all visible and clickable within the card header (not clipped to zero width and not rendered only outside the card’s visible area)

#### Scenario: Narrow window still exposes actions

- **WHEN** the user narrows the window so the action cluster wraps
- **THEN** the actions remain reachable within the header area via wrapping on the action row rather than disappearing from the layout
