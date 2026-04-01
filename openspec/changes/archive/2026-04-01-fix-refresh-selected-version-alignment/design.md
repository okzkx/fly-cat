## Context

`HomePage` already exposes a **全部刷新** button, but it refreshes freshness metadata for every synced document in the manifest, regardless of the current checked selection. It also persists the raw freshness result without updating the manifest-backed local version label, so the UI can continue to show `本地 <old> / 远端 <new>` immediately after the user-triggered refresh that is supposed to align them.

This fix touches both the frontend selection flow and the Tauri-backed manifest/status persistence path.

## Goals / Non-Goals

**Goals:**

- Re-scope **全部刷新** to the currently checked document/bitable leaves that already have a synced manifest row.
- Align manifest-backed local version/update-time metadata to the refreshed remote values when the task rule says local/remote are out of sync.
- Update the in-memory freshness map and refreshed sync statuses in the same user action so the tree labels change immediately.

**Non-Goals:**

- Creating sync-manifest rows for never-synced documents.
- Re-downloading document content or creating sync tasks.
- Changing per-row **重新同步** semantics.

## Decisions

1. **Reuse checked-leaf collection logic**
   Use the same checked descendant collection already used by batch delete: derive checked leaf ids from `expandedCheckedKeys` and `collectDocumentIdsByTreeKeys(...)`, then intersect with synced manifest ids. This keeps the toolbar action aligned with the user's visible checked scope rather than all synced documents globally.

2. **Add a small backend manifest-alignment command**
   Introduce a Tauri command that loads the manifest, updates existing records for selected document ids, and saves the manifest back. The command only mutates existing manifest rows and only for freshness results without errors, avoiding any fake "synced" records for never-synced items.

3. **Apply an explicit alignment predicate**
   A selected synced record is aligned when either:
   - local version is empty and remote version is present
   - local version is present and remote version is empty
   - both versions are present and local compares lower than remote

   When aligned, the manifest `version`/`update_time` become the remote values, and the returned freshness entry is normalized to a `current` state with matching local/remote values so the UI updates immediately.

4. **Keep failures non-destructive**
   If freshness lookup returns `error`, the action preserves existing local manifest metadata and leaves the freshness result untouched. This avoids blanking or corrupting local version state on transport/auth failures.

## Risks / Trade-offs

- **Version comparison may not always be purely numeric** → Use a numeric-first comparison with a stable string fallback, and only auto-align when the local side is clearly lower.
- **Selection depends on loaded descendants** → This matches existing batch-delete behavior and avoids introducing a second selection model.
- **Metadata-only alignment can make content freshness look newer than local files** → This is an intentional trade-off required by the queued task wording; the button still does not claim to re-download content.
