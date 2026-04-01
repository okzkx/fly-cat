## Why

The current **全部刷新** action only refreshes remote freshness metadata for all synced documents, so it ignores the user's current checked selection and leaves the local version label unchanged even when the task intent is to align the selected documents' local/remote version state. This makes the button behavior diverge from the queued fix wording in `TODO.md`.

## What Changes

- Change **全部刷新** so it operates on the currently checked document/bitable leaves instead of all synced documents.
- After fetching remote freshness for the selected synced leaves, update local version metadata so the local version state matches the remote version whenever the versions differ or one side is missing.
- Keep the action as a metadata refresh only: it still does not re-download document bodies or create sync tasks.

## Capabilities

### New Capabilities

### Modified Capabilities

- `knowledge-tree-display`: The bulk refresh control behavior changes from "all synced documents" to "currently selected synced leaves" and now aligns the displayed local version metadata to the refreshed remote version state.

## Impact

- Frontend knowledge tree selection and toolbar refresh logic in `src/components/HomePage.tsx`
- App callbacks and Tauri runtime bridge in `src/App.tsx` and `src/utils/tauriRuntime.ts`
- Manifest/status update command and persistence in `src-tauri/src/commands.rs` and `src-tauri/src/storage.rs`
- OpenSpec delta for `knowledge-tree-display`
