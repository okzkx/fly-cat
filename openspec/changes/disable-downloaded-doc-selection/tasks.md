# Tasks: disable-downloaded-doc-selection

## Tasks

- [ ] 1. Add `get_synced_document_ids` Tauri command in `commands.rs`
- [ ] 2. Add `getSyncedDocumentIds()` in `tauriRuntime.ts` with browser fallback
- [ ] 3. Add `downloadedDocumentIds` state in `App.tsx`, load on bootstrap and settings change
- [ ] 4. Pass `downloadedDocumentIds` to `HomePage`, integrate into `buildTreeNodes` disable logic
