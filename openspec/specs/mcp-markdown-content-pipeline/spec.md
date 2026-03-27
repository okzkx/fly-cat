# mcp-markdown-content-pipeline Specification

## Purpose
TBD - created by archiving change create-feishu-knowledge-base-sync-app. Update Purpose after archive.
## Requirements
### Requirement: MCP-Based Document Content Retrieval
The system MUST fetch document content through MCP-mediated Feishu API access rather than file export endpoints.

#### Scenario: Retrieve structured content through MCP
- **WHEN** the sync worker processes a queued knowledge base document
- **THEN** it requests document content via configured MCP Feishu integration APIs

#### Scenario: Handle MCP retrieval failure
- **WHEN** MCP content retrieval returns an error or invalid response
- **THEN** the worker marks the document as failed and records a retriable error result

### Requirement: Canonical Markdown Generation
The system MUST transform retrieved document content into deterministic Markdown output.

#### Scenario: Generate markdown for unchanged content model
- **WHEN** two sync runs receive equivalent structured content for the same document
- **THEN** the generated Markdown is byte-equivalent except for explicitly allowed metadata fields

#### Scenario: Preserve heading and paragraph structure
- **WHEN** the source document contains hierarchical headings and paragraphs
- **THEN** the generated Markdown preserves that hierarchy in heading levels and paragraph order

### Requirement: Stable Local File Mapping
The system MUST map each synced document to a stable local Markdown path according to deterministic rules that preserve the document's knowledge-base-relative directory structure and authoritative document naming.

#### Scenario: Stable path across repeated runs
- **WHEN** the same source document is synced repeatedly without path-affecting metadata changes
- **THEN** the output file path remains unchanged between runs

#### Scenario: Preserve source directory hierarchy
- **WHEN** a synced document belongs to nested directories inside the source knowledge base
- **THEN** the local Markdown output path preserves that directory hierarchy relative to the knowledge base root

#### Scenario: Preserve source document naming
- **WHEN** a document is written to local Markdown output
- **THEN** the output file name is derived deterministically from the source document's authoritative name rather than an app-defined flat naming rule

#### Scenario: Path update on source move or rename
- **WHEN** a source document is renamed or moved to a different directory in the knowledge base
- **THEN** the system updates the local output path deterministically and updates manifest mapping

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

