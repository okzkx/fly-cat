## MODIFIED Requirements

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
