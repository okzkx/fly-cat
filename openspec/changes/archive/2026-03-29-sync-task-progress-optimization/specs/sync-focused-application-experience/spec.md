# Delta Spec: sync-focused-application-experience

## ADDED Requirements

### Requirement: Discovery Phase Visibility

The application MUST indicate when a sync task is in the document discovery phase, distinct from the active download phase.

#### Scenario: Show discovery status before download
- **WHEN** a sync task has been created and the backend is discovering documents to synchronize
- **THEN** the UI displays a discovery-phase status (e.g., "发现文档中...") with an indeterminate progress indicator instead of a percentage-based progress bar

#### Scenario: Transition from discovery to download
- **WHEN** document discovery completes and the backend begins downloading documents
- **THEN** the UI transitions from the discovery status to the normal sync progress display showing total document count and per-document progress updates
