# mcp-markdown-content-pipeline Specification

## Purpose
TBD - created by archiving change create-feishu-knowledge-base-sync-app. Update Purpose after archive.
## Requirements
### Requirement: MCP-Based Document Content Retrieval
The system MUST fetch document content through MCP-mediated Feishu API access in a way that preserves the structured block types required for Markdown rendering, including image blocks returned by the active Feishu block API, and MUST tolerate transient child-block frequency-limit responses before reporting a content-fetch failure.

#### Scenario: Retrieve structured content through MCP
- **WHEN** the sync worker processes a queued knowledge base document
- **THEN** it requests document content via configured MCP Feishu integration APIs

#### Scenario: Recognize current Feishu image block type
- **WHEN** the Feishu block API returns an image block using the current image `block_type`
- **THEN** the parser classifies that block as an image block and preserves its media token for downstream Markdown rendering

#### Scenario: Preserve compatibility with legacy image block type
- **WHEN** the parser encounters the previously assumed legacy image `block_type`
- **THEN** it still preserves that block as an image block instead of dropping it

#### Scenario: Retry transient child-block frequency limits
- **WHEN** a child-block request returns Feishu frequency-limit response `code=99991400` during block traversal
- **THEN** the content pipeline retries that child-block fetch within a bounded retry budget before failing the document

#### Scenario: Exhaust retry budget for throttled child-block traversal
- **WHEN** repeated child-block requests continue returning Feishu frequency-limit responses until the retry budget is exhausted
- **THEN** the worker reports a content-fetch stage failure instead of silently treating the document as synced

#### Scenario: Handle non-retryable MCP retrieval failure
- **WHEN** MCP content retrieval returns a non-retryable error or invalid response
- **THEN** the worker marks the document as failed and records a retriable error result

### Requirement: Canonical Markdown Generation
The system MUST transform retrieved document content into deterministic Markdown output, and any document that is mapped to a local `.md` path MUST be rendered from structured content rather than copied from an exported binary office file.

#### Scenario: Generate markdown for unchanged content model
- **WHEN** two sync runs receive equivalent structured content for the same document
- **THEN** the generated Markdown is byte-equivalent except for explicitly allowed metadata fields

#### Scenario: Preserve heading and paragraph structure
- **WHEN** the source document contains hierarchical headings and paragraphs
- **THEN** the generated Markdown preserves that hierarchy in heading levels and paragraph order

#### Scenario: Preserve nested ordered and bullet list indentation
- **WHEN** the source document contains ordered or bullet list items nested under a parent list item in the Feishu block tree
- **THEN** the generated Markdown indents nested list markers relative to their parent level using consistent leading spaces per nesting depth

#### Scenario: Restart ordered numbering per nesting depth
- **WHEN** the source document contains nested ordered list items at a deeper level than their parent list item
- **THEN** the generated Markdown uses a separate incrementing index sequence for each nesting depth so child lists do not continue the parent list's global counter

#### Scenario: Markdown-targeted documents do not use export binaries
- **WHEN** the sync worker processes a normal Feishu document whose expected output path ends with `.md`
- **THEN** it renders Markdown from the structured content pipeline instead of writing a binary export payload into that Markdown path

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

### Requirement: Decoded external hyperlink targets in Markdown

The system MUST normalize Feishu `text_run` hyperlink URLs when they are percent-encoded absolute web URLs so that generated Markdown uses standard `http://` or `https://` link targets.

#### Scenario: Percent-encoded https URL is decoded for Markdown

- **WHEN** a text run's link metadata contains a percent-encoded absolute URL whose decoded form is a valid `https://` URL (for example `https%3A%2F%2Fhost%2Fpath%2F`)
- **THEN** the Markdown pipeline emits that link using the decoded `https://host/path/` target

#### Scenario: Already-canonical https URL is unchanged

- **WHEN** a text run's link metadata already begins with `https://` or `http://`
- **THEN** the pipeline preserves that URL string for Markdown emission (aside from trimming leading and trailing whitespace)

