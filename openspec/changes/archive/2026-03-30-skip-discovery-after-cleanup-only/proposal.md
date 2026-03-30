## Why

When the user only unchecks already-synced documents or folders to delete them locally, clicking "开始同步" should perform cleanup and stop. The current flow deletes those files first but then falls back to `selectedScope` and creates a new sync task anyway, which can trigger an unnecessary discovery request and surface unrelated rate-limit errors.

## What Changes

- Treat "cleanup only" runs as a first-class path: after deleting unchecked synced documents, do not create a sync task if the user did not explicitly choose any new sync sources.
- Keep the existing cleanup behavior for unchecked synced documents and refresh status after deletion.
- Prevent cleanup-only runs from triggering remote discovery and producing misleading discovery-stage failures.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `synced-doc-checkbox`: cleanup of unchecked synced documents must not create a follow-up sync task when the user has no explicit sources selected for synchronization.

## Impact

- Affected code: `src/App.tsx`, `src/types/app.ts`, related frontend tests
- User-facing behavior: cleanup-only actions finish locally without starting a new discovery run
- OpenSpec artifacts: update `synced-doc-checkbox` requirement and archive report
