## 1. Project Bootstrap and Baseline Architecture

- [x] 1.1 Initialize the new application skeleton and module layout, referencing reusable structure patterns from `F:\okzkx\feishu_docs_export`.
- [x] 1.2 Define core configuration model for sync root, knowledge base scope, MCP endpoint settings, and runtime environment variables.
- [x] 1.3 Set up foundational logging and error taxonomy for sync workflow, MCP calls, transform errors, and file I/O failures.

## 2. Knowledge Base Discovery and Sync Planning

- [x] 2.1 Implement knowledge-base-only source discovery service and filter out non-knowledge-base document containers.
- [x] 2.2 Implement sync manifest schema and persistence layer storing document IDs, version metadata, output paths, and last status.
- [x] 2.3 Build incremental sync planner that classifies documents into `sync`, `skip`, and `retry` sets from manifest + remote metadata.

## 3. MCP Content Retrieval and Markdown Pipeline

- [x] 3.1 Implement MCP client integration for Feishu document content retrieval with request/response validation and retry boundaries.
- [x] 3.2 Build canonical intermediate document model decoupled from raw Feishu API payload structure.
- [x] 3.3 Implement deterministic Markdown renderer that preserves document hierarchy and stable output formatting.
- [x] 3.4 Implement deterministic local path mapping rules and manifest update logic for renamed/moved documents.

## 4. Image Resolution and Asset Fallback

- [x] 4.1 Implement remote-first image resolution checks and keep valid remote URLs in generated Markdown.
- [x] 4.2 Implement fallback image downloader writing hashed filenames to a fixed assets subdirectory under sync root.
- [x] 4.3 Implement Markdown image-link rewriting to local relative asset paths for fallback images.
- [x] 4.4 Add asset deduplication by hash to avoid duplicate local image files across documents.

## 5. Sync-Focused UX and Runtime Orchestration

- [x] 5.1 Implement sync-oriented UI flow for source selection, sync target preview, and explicit "start sync" interaction.
- [x] 5.2 Implement sync lifecycle state machine (`idle`, `preparing`, `syncing`, `partial-failed`, `completed`) and state transitions.
- [x] 5.3 Add run-level and document-level progress/status views including succeeded, skipped, and failed counters.
- [x] 5.4 Add actionable error display and failed-item retry action without reprocessing successful no-op items.

## 6. Validation and Hardening

- [x] 6.1 Add automated tests for incremental planning, deterministic Markdown output, image fallback behavior, and manifest persistence.
- [ ] 6.2 Run end-to-end pilot sync against a controlled knowledge base and verify path stability across repeated runs.
- [x] 6.3 Verify failure recovery by injecting MCP/API and file-system errors, then validating retry and partial-failure reporting behavior.
