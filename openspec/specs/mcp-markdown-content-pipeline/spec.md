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
The system MUST map each synced document to a stable local Markdown path according to deterministic rules.

#### Scenario: Stable path across repeated runs
- **WHEN** the same source document is synced repeatedly without path-affecting metadata changes
- **THEN** the output file path remains unchanged between runs

#### Scenario: Path update on deterministic rename rule
- **WHEN** a source title or folder mapping changes according to configured naming rules
- **THEN** the system updates output path deterministically and updates manifest mapping

