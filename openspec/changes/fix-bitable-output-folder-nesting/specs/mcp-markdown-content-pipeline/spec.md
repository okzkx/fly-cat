## MODIFIED Requirements

### Requirement: Stable Local File Mapping
The system MUST map each synced document to a stable local output path according to deterministic rules that preserve the document's knowledge-base-relative directory structure and authoritative document naming.

#### Scenario: Stable path across repeated runs
- **WHEN** the same source document is synced repeatedly without path-affecting metadata changes
- **THEN** the output file path remains unchanged between runs

#### Scenario: Preserve source directory hierarchy
- **WHEN** a synced document belongs to nested directories inside the source knowledge base
- **THEN** the local output path preserves that directory hierarchy relative to the knowledge base root

#### Scenario: Preserve source document naming
- **WHEN** a document is written to local output
- **THEN** the output file name is derived deterministically from the source document's authoritative name rather than an app-defined flat naming rule

#### Scenario: Export-only files do not create duplicate title folders
- **WHEN** a `bitable` or `sheet` document is exported from a nested knowledge-base path
- **THEN** the local output path uses only the parent path segments as directories and writes the exported file directly as `<title>.xlsx` instead of `.../<title>/<title>.xlsx`

#### Scenario: Path update on source move or rename
- **WHEN** a source document is renamed or moved to a different directory in the knowledge base
- **THEN** the system updates the local output path deterministically and updates manifest mapping
