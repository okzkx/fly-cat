## ADDED Requirements

### Requirement: Reference Shell Branding Consistency
The application MUST present a consistent top-level product identity as `飞猫助手` and MUST NOT use outdated Feishu-sync product branding in shell-level titles, headers, or visible brand marks.

#### Scenario: Shell header uses FlyCat branding
- **WHEN** the application renders its top-level shell
- **THEN** the primary visible application title in the shell uses the `飞猫助手` brand rather than an outdated `飞书同步...` product label

#### Scenario: Visible shell logo or brand mark matches FlyCat identity
- **WHEN** the shell displays a logo, icon-accompanied title, or other brand mark near the primary application title
- **THEN** that visible brand treatment aligns with the `飞猫助手` identity instead of generic Feishu sync branding
