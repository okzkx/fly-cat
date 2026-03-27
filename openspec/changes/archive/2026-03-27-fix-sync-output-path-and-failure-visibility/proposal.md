## Why

The current sync experience makes it hard to tell where files are being written and why synchronization is failing. Users can see a relative path like `./synced-docs`, invalid task timestamps, and task-level failure counts, but they cannot easily confirm the real output location or diagnose why every document in a run failed.

## What Changes

- Normalize the sync output directory to a concrete desktop-visible path and surface that resolved location clearly in the UI.
- Replace debug-style task names and timestamps with user-readable values so task history can be trusted.
- Expose actionable run-level and document-level sync failure diagnostics instead of only aggregate failure counts.
- Classify pipeline failures by stage such as authorization, discovery, content fetch, markdown rendering, image handling, and filesystem write so repeated failures are understandable and recoverable.
- Make sync creation and task views show enough output-path and failure context that users can tell whether the issue is with destination configuration, remote fetch, or local write behavior.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `sync-focused-application-experience`: refine home-page and task-list behavior so users can see the real sync destination, trustworthy task timestamps, and actionable failure details.
- `tauri-desktop-runtime-and-backend`: refine backend runtime behavior so sync roots are normalized deterministically and task metadata uses stable, user-readable timestamps.
- `mcp-markdown-content-pipeline`: refine sync pipeline error reporting so failures are classified by stage and returned with actionable diagnostics.

## Impact

- Affects frontend home-page and task-list presentation for output path display, task naming, timestamp rendering, and failure detail visibility.
- Affects Tauri/Rust task creation and sync execution because sync roots, timestamps, and error payloads need normalization before reaching the UI.
- Affects sync/document pipeline contracts because backend failures must carry clearer categories and diagnostics than the current generic task failure counts.
- Requires requirement updates before implementation so destination-path behavior and failure reporting are testable rather than left as incidental UI details.
