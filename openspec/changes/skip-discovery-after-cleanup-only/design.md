## Context

`HomePage` tracks unchecked synced documents separately from explicit sync selection, and `App.tsx` deletes those documents through `removeSyncedDocuments(...)` before creating a new sync task. The bug appears when the user only wants local cleanup: after deletion, the current implementation still derives effective sources from `selectedScope`, which causes an unintended sync task and remote discovery request.

## Goals / Non-Goals

**Goals:**
- Preserve automatic cleanup of unchecked synced documents.
- Skip sync task creation when the action is cleanup-only.
- Keep normal sync creation behavior unchanged when the user explicitly selected sources.

**Non-Goals:**
- Redesign the tree selection model.
- Change backend discovery logic or rate-limit handling.
- Alter how synced-document cleanup deletes files and manifest records.

## Decisions

- Determine cleanup-only mode in `App.tsx` after local deletion completes: if `selectedSources` is empty, return without calling `createSyncTask(...)`.
- Continue refreshing `documentSyncStatuses` after cleanup so the tree immediately reflects deleted items.
- Keep the existing `selectedScope` fallback for normal sync creation paths, because it is still valid when the user is actually starting a sync from the current highlighted scope.
- Add a focused regression test around the cleanup-only path instead of broader end-to-end coverage.

## Risks / Trade-offs

- [Users may expect highlighted scope to sync by default] -> Only skip task creation when the action already performed cleanup and there are no explicit selected sources.
- [Regression in normal sync start behavior] -> Leave the existing fallback path untouched for non-cleanup runs and add a targeted regression test.
