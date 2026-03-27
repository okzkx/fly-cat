## ADDED Requirements

### Requirement: User-Facing Branding Consistency
The application MUST use consistent FlyCat / 飞猫助手 branding across user-visible page titles and task-oriented views, while preserving sync-specific wording where it describes workflow behavior rather than product identity.

#### Scenario: Primary pages use FlyCat branding
- **WHEN** a user visits major application pages such as settings, auth, home, or task views
- **THEN** the visible page-level application branding uses `飞猫助手` or `飞猫助手 / FlyCat` consistently instead of outdated `飞书同步...` product naming

#### Scenario: Task-related titles avoid outdated product branding
- **WHEN** the application shows task-oriented headings, empty states, or related user-facing labels
- **THEN** those labels remain workflow-descriptive without reintroducing outdated Feishu-sync product branding as the app identity
