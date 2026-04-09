## ADDED Requirements

### Requirement: Hover help for sync toolbar controls

The system SHALL show a hover tooltip on the knowledge base home card for each of **全部刷新**, **强制更新**, **批量删除**, and **开始同步**, describing what that control does in one short sentence without changing existing enable/disable or loading behavior.

The system SHALL show a hover tooltip on each knowledge tree row action control for **重新同步**, **在浏览器打开**, and **使用默认应用打开** (document, bitable, and folder variants), using wording consistent with the control’s existing accessible name or visible purpose.

Tooltip content MUST remain available on hover when the underlying control is disabled, using the same interaction pattern Ant Design recommends for disabled `Button` children (for example wrapping in an inline container that receives pointer events).

#### Scenario: Home card bulk actions show help

- **WHEN** the user hovers the pointer over **全部刷新**, **强制更新**, **批量删除**, or **开始同步** on the knowledge base home card
- **THEN** a tooltip appears that explains that control’s effect at a high level

#### Scenario: Tree row actions show help

- **WHEN** the user hovers the pointer over a per-row **重新同步**, **在浏览器打开**, or **使用默认应用打开** control in the knowledge tree
- **THEN** a tooltip appears that explains that control’s effect

#### Scenario: Disabled control still shows help

- **WHEN** a sync toolbar or tree-row action control is disabled
- **AND** the user hovers the control’s visible affordance (icon or label region)
- **THEN** the same explanatory tooltip can still appear
