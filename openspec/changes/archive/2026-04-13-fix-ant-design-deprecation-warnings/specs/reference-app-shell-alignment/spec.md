## ADDED Requirements

### Requirement: Ant Design layout and loading primitives avoid deprecated props

The application MUST use supported Ant Design APIs for `Space` stacking and `Spin` loading captions on primary UI surfaces so that development runs do not emit deprecation warnings for replaced props.

#### Scenario: Space stacking uses orientation

- **WHEN** a component renders `Space` for vertical or horizontal stacking
- **THEN** it MUST set `orientation` to `vertical` or `horizontal` as appropriate instead of using the deprecated `direction` prop

#### Scenario: Spin loading caption uses description

- **WHEN** a component renders `Spin` with a textual loading caption
- **THEN** it MUST pass that caption via `description` instead of the deprecated `tip` prop
