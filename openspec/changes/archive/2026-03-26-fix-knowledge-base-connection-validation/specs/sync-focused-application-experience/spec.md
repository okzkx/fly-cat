## ADDED Requirements

### Requirement: Connection Validation Shows Actionable Discovery Outcomes
The application MUST present connection validation results using user-actionable outcome categories instead of a single generic failure message.

#### Scenario: Show no-space guidance
- **WHEN** the backend classifies knowledge space loading as `connected-no-spaces`
- **THEN** the UI informs the user that the app is connected but has not been added to any knowledge space and provides guidance to join or authorize a space

#### Scenario: Show permission guidance
- **WHEN** the backend classifies knowledge space loading as `permission-denied`
- **THEN** the UI informs the user that the connection exists but required wiki read access is missing and does not label the state as a generic connection validation failure

#### Scenario: Show request failure guidance
- **WHEN** the backend classifies knowledge space loading as `request-failed` or `unexpected-response`
- **THEN** the UI shows a load failure state with retry entry points and concise diagnostics instead of presenting an empty knowledge space list

### Requirement: Empty Knowledge Space Lists Must Be Trustworthy
The application MUST only present a normal empty knowledge space state when backend discovery completed successfully.

#### Scenario: Empty list from successful discovery
- **WHEN** the backend returns a successful knowledge space discovery result with zero spaces
- **THEN** the UI renders the empty knowledge space state as a valid but actionable configuration outcome

#### Scenario: Empty list from failed discovery
- **WHEN** the backend fails to load knowledge spaces and no authoritative successful discovery result exists
- **THEN** the UI renders an error state rather than an empty knowledge space list
