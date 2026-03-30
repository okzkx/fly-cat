## MODIFIED Requirements

### Requirement: MCP-Based Document Content Retrieval
The system MUST fetch document content through MCP-mediated Feishu API access in a way that preserves the full structured block tree needed for Markdown rendering, including nested descendant blocks that contain images.

#### Scenario: Retrieve structured content through MCP
- **WHEN** the sync worker processes a queued knowledge base document
- **THEN** it requests document content via configured MCP Feishu integration APIs

#### Scenario: Traverse nested descendant blocks
- **WHEN** a Feishu document stores renderable content under descendant blocks instead of only direct root children
- **THEN** the sync worker recursively traverses those descendant blocks in document order before canonical Markdown generation

### Requirement: Canonical Markdown Generation
The system MUST transform retrieved document content into deterministic Markdown output.

#### Scenario: Generate markdown for unchanged content model
- **WHEN** two sync runs receive equivalent structured content for the same document
- **THEN** the generated Markdown is byte-equivalent except for explicitly allowed metadata fields

#### Scenario: Preserve heading and paragraph structure
- **WHEN** the source document contains hierarchical headings and paragraphs
- **THEN** the generated Markdown preserves that hierarchy in heading levels and paragraph order

#### Scenario: Preserve nested image blocks in Markdown
- **WHEN** an image block appears inside a nested descendant block subtree
- **THEN** the generated Markdown still includes the corresponding image syntax at the correct position in the flattened output
