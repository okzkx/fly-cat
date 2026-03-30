## MODIFIED Requirements

### Requirement: MCP-Based Document Content Retrieval
The system MUST fetch document content through MCP-mediated Feishu API access in a way that preserves the structured block types required for Markdown rendering, including image blocks returned by the active Feishu block API.

#### Scenario: Retrieve structured content through MCP
- **WHEN** the sync worker processes a queued knowledge base document
- **THEN** it requests document content via configured MCP Feishu integration APIs

#### Scenario: Recognize current Feishu image block type
- **WHEN** the Feishu block API returns an image block using the current image `block_type`
- **THEN** the parser classifies that block as an image block and preserves its media token for downstream Markdown rendering

#### Scenario: Preserve compatibility with legacy image block type
- **WHEN** the parser encounters the previously assumed legacy image `block_type`
- **THEN** it still preserves that block as an image block instead of dropping it
