## MODIFIED Requirements

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
