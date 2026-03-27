## ADDED Requirements

### Requirement: Pipeline Failure Stage Classification
The system MUST classify document sync failures by pipeline stage when content retrieval, transformation, or persistence fails.

#### Scenario: Remote content fetch failure is classified
- **WHEN** the sync worker cannot retrieve document content from the remote source
- **THEN** the failure is classified as a content-fetch stage error rather than only a generic sync failure

#### Scenario: Markdown generation failure is classified
- **WHEN** the sync worker retrieves source content but cannot transform it into Markdown output
- **THEN** the failure is classified as a markdown-render stage error with a concise diagnostic message

#### Scenario: Local asset or file write failure is classified
- **WHEN** the sync worker has the content needed to persist output but fails while writing Markdown or image assets locally
- **THEN** the failure is classified as a filesystem-write or image-resolution stage error instead of being reported only as a generic fetch failure
