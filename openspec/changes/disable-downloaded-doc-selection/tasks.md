# Tasks: disable-downloaded-doc-selection

## Tasks

- [x] 1. Add `get_synced_document_ids` Tauri command in `commands.rs`
- [x] 2. Add `getSyncedDocumentIds()` in `tauriRuntime.ts` with browser fallback
- [x] 3. Add `downloadedDocumentIds` state in `App.tsx`, load on bootstrap and settings change
- [x] 4. Pass `downloadedDocumentIds` to `HomePage`, integrate into `buildTreeNodes` disable logic
