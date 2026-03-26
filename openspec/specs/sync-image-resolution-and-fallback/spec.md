# sync-image-resolution-and-fallback Specification

## Purpose
TBD - created by archiving change create-feishu-knowledge-base-sync-app. Update Purpose after archive.
## Requirements
### Requirement: Remote-First Image Referencing
The system MUST prefer remote image URLs in generated Markdown when those URLs are valid and accessible under the active sync context.

#### Scenario: Keep valid remote image URL
- **WHEN** an image reference resolves to an accessible remote URL during sync processing
- **THEN** the generated Markdown keeps the remote URL as the image source

#### Scenario: Reject invalid remote image URL
- **WHEN** an image reference cannot be validated as accessible in the current sync context
- **THEN** the system marks the image for fallback download processing

### Requirement: Hashed Filename Local Fallback
The system MUST store fallback images using hashed filenames in a fixed assets subdirectory under the sync root.

#### Scenario: Save fallback image with hashed name
- **WHEN** fallback download succeeds for an image
- **THEN** the system stores the file in the fixed assets directory using a deterministic hash-based filename and appropriate extension

#### Scenario: Reuse existing hashed asset
- **WHEN** the same image content hash already exists in the assets directory
- **THEN** the system reuses the existing file and does not duplicate asset storage

### Requirement: Markdown Image Link Rewriting
The system MUST rewrite Markdown image references to local fallback paths when remote-first resolution fails.

#### Scenario: Rewrite to local relative path
- **WHEN** an image is processed through fallback storage
- **THEN** the generated Markdown image reference points to the corresponding local relative asset path

#### Scenario: Mixed remote and local image outputs
- **WHEN** a document contains both valid-remote and fallback-required images
- **THEN** the generated Markdown preserves remote links for valid images and local paths for fallback images in the same document

