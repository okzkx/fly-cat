## MODIFIED Requirements

### Requirement: Remote-First Image Referencing
The system MUST prefer remote image URLs in generated Markdown only when those URLs are directly usable by the resulting local Markdown output without additional authenticated request headers.

#### Scenario: Keep valid remote image URL
- **WHEN** an image reference resolves to an accessible remote URL during sync processing
- **THEN** the generated Markdown keeps the remote URL as the image source

#### Scenario: Reject auth-gated remote media URL
- **WHEN** an image reference resolves to a Feishu media endpoint that requires bearer authentication and cannot be rendered directly by local Markdown viewers
- **THEN** the system marks the image for fallback download processing instead of keeping that remote URL in Markdown

### Requirement: Hashed Filename Local Fallback
The system MUST store fallback images using hashed filenames in a fixed assets subdirectory under the sync root.

#### Scenario: Save fallback image with hashed name and detected extension
- **WHEN** fallback download succeeds for an image
- **THEN** the system stores the file in the fixed assets directory using a deterministic hash-based filename and an extension derived from the downloaded media metadata when available

#### Scenario: Reuse existing hashed asset
- **WHEN** the same image content hash already exists in the assets directory
- **THEN** the system reuses the existing file and does not duplicate asset storage

### Requirement: Markdown Image Link Rewriting
The system MUST rewrite Markdown image references to local fallback paths when remote-first resolution fails.

#### Scenario: Rewrite to local relative path from document to sync-root asset
- **WHEN** an image is processed through fallback storage
- **THEN** the generated Markdown image reference points to the correct relative path from the Markdown document location to the fixed sync-root asset path
