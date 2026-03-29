## ADDED Requirements

### Requirement: Fetch Document Blocks via Feishu Block API
The system MUST retrieve document content using the Feishu Block API instead of the raw_content endpoint.

#### Scenario: Fetch blocks for a document
- **WHEN** the sync process requests document content
- **THEN** the system calls `/docx/v1/documents/{document_id}/blocks/{document_id}` to get the root block and its children

#### Scenario: Handle block API failure
- **WHEN** the block API returns an error or invalid response
- **THEN** the system returns a descriptive error and marks the document sync as failed

### Requirement: Parse Image Blocks
The system MUST correctly identify and parse image blocks (block_type: 28) from the Feishu Block API response.

#### Scenario: Identify image block
- **WHEN** the block API response contains a block with `block_type: 28`
- **THEN** the system extracts `image.token` as the media_id for the image

#### Scenario: Image block with token
- **WHEN** an image block contains a valid `image.token` field
- **THEN** the system creates a RawBlock::Image with the token as media_id

#### Scenario: Image block without token
- **WHEN** an image block is missing the `image.token` field
- **THEN** the system creates a RawBlock::Paragraph with placeholder text to preserve document structure

### Requirement: Parse Other Block Types
The system MUST parse common block types to preserve document structure.

#### Scenario: Parse heading block
- **WHEN** the block API response contains a block with `block_type: 2`
- **THEN** the system creates a RawBlock::Heading with the appropriate level and text

#### Scenario: Parse text block
- **WHEN** the block API response contains a block with `block_type: 1`
- **THEN** the system creates a RawBlock::Paragraph with the text content

#### Scenario: Fallback for unknown block types
- **WHEN** the block API response contains an unrecognized block_type
- **THEN** the system creates a RawBlock::Paragraph with fallback text content to avoid data loss
