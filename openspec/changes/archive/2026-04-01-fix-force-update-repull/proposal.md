## Why

**强制更新** currently only refreshes remote metadata and overwrites manifest version fields. Users expect it to match the product rule: remove local copies first, then pull from Feishu again so disk content and metadata stay consistent. Without deleting local files and re-running sync, “force” has no visible download effect when versions already match after alignment.

## What Changes

- Add a Tauri command that deletes on-disk outputs (and image assets) for the given manifest rows while **keeping** manifest records, and clears version-related fields so state reflects a pending re-pull.
- Treat “unchanged” in the sync pipeline as false when the manifest output file is missing, so aligned metadata cannot skip a needed re-download.
- Wire **强制更新** in the home UI to: run the strip command, run the existing batch freshness + forced manifest alignment, refresh statuses, then start a normal sync task from the current effective selection (same scope as **开始同步**), unless a task is already pending or syncing.

## Capabilities

### Modified Capabilities

- `knowledge-tree-display`: **强制更新** semantics include local file removal and a follow-up sync pull; **全部刷新** stays metadata-only.

## Impact

- `src-tauri/src/commands.rs` (new command, `is_document_unchanged` tweak, tests)
- `src-tauri/src/lib.rs` (register command)
- `src/utils/tauriRuntime.ts`, `src/utils/taskManager.ts` (invoke wrapper)
- `src/types/app.ts`, `src/components/HomePage.tsx`, `src/App.tsx`
- `openspec/specs/knowledge-tree-display/spec.md`
