# Design: disable-downloaded-doc-selection

## Architecture

### Data Flow

```
Tauri Backend                        Frontend
─────────────                        ────────
load_manifest(sync_root)
  → Vec<ManifestRecord>
  → extract document_ids
  → return Vec<String>
        │
        ▼
  get_synced_document_ids command
        │
        ▼
tauriRuntime.getSyncedDocumentIds(syncRoot)
        │
        ▼
App.tsx — useState<Set<string>>
        │
        ▼
HomePage — prop: downloadedDocumentIds: Set<string>
        │
        ▼
buildTreeNodes — check node.documentId in set
  → disableCheckbox: true if downloaded
```

### Key Decisions

1. **New Tauri command `get_synced_document_ids`**: Accepts `sync_root: String`, returns `Vec<String>` of document IDs that have been successfully synced. Extracts only the `document_id` field from manifest records where `status == "success"`.

2. **Frontend state**: `Set<string>` stored in `App.tsx`, loaded once on bootstrap alongside settings and spaces. Reloaded when settings change (new sync root).

3. **Tree disable logic**: In `buildTreeNodes`, if `node.documentId` exists in the `downloadedDocumentIds` set, the node's checkbox is disabled. This is combined with the existing `isDisabledNode` (covered-descendant) check.

4. **Browser fallback**: Return empty array — all documents remain selectable in dev mode.

## Changed Files

| File | Change |
|------|--------|
| `src-tauri/src/commands.rs` | Add `get_synced_document_ids` command |
| `src/utils/tauriRuntime.ts` | Add `getSyncedDocumentIds()` function |
| `src/App.tsx` | Load document IDs on bootstrap, pass to HomePage |
| `src/components/HomePage.tsx` | Accept prop, use in `buildTreeNodes` |
| `src/types/app.ts` | Add prop to `HomePageProps` (optional — uses existing pattern) |
