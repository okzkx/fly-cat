## MODIFIED Requirements

### Requirement: MCP-Based Document Content Retrieval
The system MUST fetch document content through MCP-mediated Feishu Block API access to obtain structured content including images.

#### Scenario: Retrieve structured content through MCP
- **WHEN** the sync worker processes a queued knowledge base document
- **THEN** it requests document content via the Feishu Block API (`/docx/v1/documents/{document_id}/blocks/{document_id}`) to get structured block data

#### Scenario: Handle MCP retrieval failure
- **WHEN** MCP content retrieval returns an error or invalid response
- **THEN** the worker marks the document as failed and records a retriable error result

### Requirement: Canonical Markdown Generation
The system MUST transform retrieved document content into deterministic Markdown output, including proper image syntax.

#### Scenario: Generate markdown for unchanged content model
- **WHEN** two sync runs receive equivalent structured content for the same document
- **THEN** the generated Markdown is byte-equivalent except for explicitly allowed metadata fields

#### Scenario: Preserve heading and paragraph structure
- **WHEN** the source document contains hierarchical headings and paragraphs
- **THEN** the generated Markdown preserves that hierarchy in heading levels and paragraph order

#### Scenario: Generate markdown image syntax for image blocks
- **WHEN** the source document contains image blocks with valid media_id
- **THEN** the generated Markdown includes proper image syntax `![alt](image_path)` instead of plain text placeholders

#### Scenario: Image with fallback text for missing media_id
- **WHEN** an image block has no valid media_id
- **THEN** the generated Markdown includes a placeholder paragraph to indicate missing image
