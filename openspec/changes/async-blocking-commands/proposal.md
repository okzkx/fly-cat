# Proposal: async-blocking-commands

## Problem

Two critical Tauri commands run synchronously on the main thread, blocking the UI:

1. **`list_space_source_tree`** (commands.rs:2321) — Called when expanding tree nodes. Makes blocking HTTP calls:
   - `resolve_space_name` → `client.list_spaces()` (HTTP)
   - `resolve_path_segments_for_node` → recursive `client.list_child_nodes()` (multiple HTTP calls)
   - `build_tree_nodes_from_openapi` → `client.list_child_nodes()` (HTTP)

2. **`create_sync_task`** (commands.rs:2363) — Called when user creates a sync task. Calls `discover_documents_from_openapi` which:
   - Recursively walks all child nodes via `client.list_child_nodes()`
   - Calls `client.fetch_document_summary()` for each leaf document (N sequential HTTP calls)
   - For a knowledge base with 50 documents, this means 50+ sequential HTTP requests on the main thread

**Impact:** The user experiences a frozen window for seconds to tens of seconds when loading child nodes or creating sync tasks with many documents.

## Solution

Convert the two blocking commands to async Tauri commands using `#[tauri::command(async)]` with `tokio::task::spawn_blocking`. This moves the HTTP work off the main thread while keeping the Tauri invoke API identical for the frontend.

### Approach

- Add `tokio` dependency with `rt-multi-thread` feature
- Convert `list_space_source_tree` to async using `tokio::task::spawn_blocking`
- Convert `create_sync_task` to async using `tokio::task::spawn_blocking`
- No frontend changes required — Tauri invoke returns a Promise in both sync and async modes

### Why spawn_blocking instead of async/await with ureq

`ureq` is a synchronous HTTP client. Converting it to an async client (e.g., reqwest) would require rewriting the entire `mcp.rs` API surface. `spawn_blocking` wraps the existing synchronous code at minimal cost — the blocking work moves to a dedicated thread pool, freeing the async runtime threads for other work.

### Alternative considered: convert ureq to reqwest

Would require rewriting all 10+ methods in `FeishuOpenApiClient` and changing every call site. The async benefit is marginal since we already use `std::thread::scope` for parallel document sync. spawn_blocking is the pragmatic choice.

## Scope

- `src-tauri/Cargo.toml`: Add `tokio` with `rt-multi-thread` feature
- `src-tauri/src/commands.rs`: Convert 2 commands to async (list_space_source_tree, create_sync_task)
- No frontend changes
- No changes to mcp.rs, sync.rs, or model.rs

## Affected Specs

- `tauri-desktop-runtime-and-backend`: Async command execution strengthens the Rust-side orchestration story
- `sync-focused-application-experience`: Tree expansion and sync creation will no longer freeze the UI
