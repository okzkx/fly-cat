## Why

The current selected-leaf **全部刷新** action was just corrected to refresh remote freshness metadata and only align local version labels when the remote side is newer or one side is missing. The remaining queued task asks for a separate **强制更新** control that always makes the selected synced documents' local version metadata match the remote side, without regressing the normal refresh behavior.

## What Changes

- Add a separate **强制更新** button on the knowledge base home card for the currently checked synced document/bitable leaves.
- Keep **全部刷新** as the normal metadata refresh flow with its existing conditional alignment rule.
- Add an explicit alignment mode in the Tauri/storage path so the new force-update action always overwrites local manifest version/update-time metadata with refreshed remote metadata when the refresh succeeds.
- Add focused regression coverage for both normal refresh and force-update alignment behavior.

## Capabilities

### New Capabilities

### Modified Capabilities

- `knowledge-tree-display`: The toolbar refresh area now exposes separate normal refresh and force-update actions for checked synced leaves, with different local-version alignment rules.

## Impact

- Frontend toolbar behavior in `src/components/HomePage.tsx`
- Tauri bridge helpers in `src/utils/tauriRuntime.ts`
- Manifest alignment command/storage logic in `src-tauri/src/commands.rs` and `src-tauri/src/storage.rs`
- OpenSpec delta for `knowledge-tree-display`
