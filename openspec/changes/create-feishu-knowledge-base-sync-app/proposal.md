## Why

Current Feishu document tooling is export-oriented and optimized for one-time Word downloads, which does not fit a continuous knowledge base synchronization workflow. A dedicated sync app is needed now to keep local Markdown mirrors of Feishu knowledge base documents up to date for engineering collaboration, search, and versioned content workflows.

## What Changes

- Build a new Feishu document sync application from scratch, reusing architectural ideas from `F:\okzkx\feishu_docs_export` but shifting from export behavior to stateful synchronization behavior.
- Scope supported source content to Feishu knowledge base documents only; non-knowledge-base content is out of scope.
- Replace Word export pipelines with MCP-driven Feishu API content retrieval and Markdown generation pipelines.
- Introduce sync-specific UX and interaction patterns (source selection, sync status, incremental updates, conflict/error visibility) instead of download/export interactions.
- Implement image handling strategy with remote external links as first priority; if unavailable, hash image filenames and store downloaded assets in a fixed sync-directory subfolder.

## Capabilities

### New Capabilities
- `knowledge-base-source-sync`: Synchronize only Feishu knowledge base documents with incremental sync behavior and local state tracking.
- `mcp-markdown-content-pipeline`: Fetch document content through MCP and Feishu APIs, then transform and persist documents as Markdown files.
- `sync-image-resolution-and-fallback`: Resolve image references to remote links when possible, and fallback to hashed-filename local asset download in a fixed folder.
- `sync-focused-application-experience`: Provide app workflows and UI states designed around synchronization lifecycle rather than one-shot export.

### Modified Capabilities
- None.

## Impact

- Affects full-stack project bootstrap: application shell, sync orchestration, data model, storage layout, and user interaction flow.
- Depends on MCP integration and Feishu API connectivity for document and media retrieval.
- Introduces new local file layout constraints for Markdown outputs and image asset fallback directory.
- Requires robust sync-state tracking and error handling to support repeatable synchronization runs.
