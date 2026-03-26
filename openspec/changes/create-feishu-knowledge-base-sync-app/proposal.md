## Why

Current Feishu document tooling is export-oriented and optimized for one-time Word downloads, which does not fit a continuous knowledge base synchronization workflow. A dedicated sync app is needed now to keep local Markdown mirrors of Feishu knowledge base documents up to date for engineering collaboration, search, and versioned content workflows, while still preserving the mature product shell, interaction rhythm, desktop runtime, and code organization proven in `F:\okzkx\feishu_docs_export`.

## What Changes

- Build a new Feishu document sync application from scratch, reusing architectural ideas from `F:\okzkx\feishu_docs_export` but shifting from export behavior to stateful synchronization behavior.
- Keep the overall product presentation, Tauri desktop application shell, page routing rhythm, Rust backend split, and major code organization closely aligned with `F:\okzkx\feishu_docs_export`, unless a sync-specific requirement forces divergence.
- Scope supported source content to Feishu knowledge base documents only; non-knowledge-base content is out of scope.
- Replace Word export pipelines with MCP-driven Feishu API content retrieval and Markdown generation pipelines.
- Implement the application as a real Tauri desktop project with `src-tauri`, Rust commands/events, plugin configuration, and `npm run tauri dev` workflow rather than a web-only prototype.
- Reuse the reference app's page model (`settings -> auth -> home -> task list`), header/user area, configuration guidance, and event-driven task/status update pattern, but rename and adapt those flows for synchronization rather than export/download.
- Introduce sync-specific UX and interaction patterns (source selection, sync status, incremental updates, conflict/error visibility) instead of download/export interactions.
- Implement image handling strategy with remote external links as first priority; if unavailable, hash image filenames and store downloaded assets in a fixed sync-directory subfolder.

## Capabilities

### New Capabilities
- `knowledge-base-source-sync`: Synchronize only Feishu knowledge base documents with incremental sync behavior and local state tracking.
- `mcp-markdown-content-pipeline`: Fetch document content through MCP and Feishu APIs, then transform and persist documents as Markdown files.
- `sync-image-resolution-and-fallback`: Resolve image references to remote links when possible, and fallback to hashed-filename local asset download in a fixed folder.
- `sync-focused-application-experience`: Provide app workflows and UI states designed around synchronization lifecycle rather than one-shot export.
- `reference-app-shell-alignment`: Preserve the reference project's application shell, page composition, component boundaries, and core desktop interaction conventions while swapping export logic for sync logic.
- `tauri-desktop-runtime-and-backend`: Provide a real Tauri desktop runtime with Rust-side sync orchestration, native file access, plugin wiring, and frontend/backend event bridging.

### Modified Capabilities
- None.

## Impact

- Affects full-stack project bootstrap: application shell, sync orchestration, data model, storage layout, and user interaction flow.
- Requires stronger parity with the reference project's frontend stack, page decomposition, and Tauri-side event/task architecture than previously documented.
- Requires replacing the current web-only prototype path with a proper Tauri project structure and native runtime responsibilities.
- Depends on MCP integration and Feishu API connectivity for document and media retrieval.
- Introduces new local file layout constraints for Markdown outputs and image asset fallback directory.
- Requires robust sync-state tracking and error handling to support repeatable synchronization runs.
