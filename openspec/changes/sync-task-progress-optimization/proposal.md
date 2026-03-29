# Proposal: sync-task-progress-optimization

## Problem

Users report that after clicking "开始同步", the sync task appears very slowly in the task list. Additionally, once the task starts syncing, progress updates are not shown in real-time per document download.

### Root Cause

1. **`create_sync_task` blocks on document discovery**: The command calls `discover_documents_from_sources` via `tokio::task::spawn_blocking`, making N HTTP calls to the Feishu API to enumerate all documents. The task is only returned to the frontend after this completes, so the user waits several seconds before seeing any task appear.

2. **Document discovery is duplicated**: Discovery runs once in `create_sync_task` (blocking) and again in `spawn_sync_progress` (line 1813-1915 in commands.rs), doubling the total API calls.

3. **Progress events batched per chunk**: In `spawn_sync_progress`, `emit_task_event` is called once per chunk (concurrency = 8 documents) rather than after each individual document, so the user sees progress jumps of 8 documents at a time.

4. **No discovery-phase feedback**: There is no lifecycle state for the document discovery phase, so the user has no indication of what is happening during the initial wait.

## Why

The user expects to see the sync task appear immediately after clicking "开始同步", with clear progress feedback throughout the entire sync lifecycle. The current implementation's blocking discovery and batched progress events create a poor user experience.

## Scope

- **Backend (Rust)**: Restructure `create_sync_task` to return the task immediately without document discovery; move discovery into `spawn_sync_progress`; emit progress events per document instead of per chunk
- **Frontend (React)**: Show a "discovering" lifecycle state in the task list while documents are being enumerated; ensure progress bar updates after each document download
- **Spec impact**: Add discovery-phase lifecycle state visibility to `sync-focused-application-experience` spec

## Non-goals

- Changing the document download algorithm or export strategy
- Modifying the concurrency level for document processing
- Changing error handling or retry logic
