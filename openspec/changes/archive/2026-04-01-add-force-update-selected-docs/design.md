## Context

`HomePage` currently has one bulk metadata action, **全部刷新**, for the currently checked synced document and bitable leaves. The recent fix already narrowed its scope to the checked synced leaves and aligned local manifest versions only when the remote side is newer or one side is missing.

The remaining queued task asks for a second action, **强制更新**, that still works on the same checked synced leaves but always makes the local manifest-backed version metadata match the freshly fetched remote metadata. This must be added without changing the semantics of the normal refresh button.

## Goals / Non-Goals

**Goals:**

- Add a separate **强制更新** control next to the existing toolbar actions on the knowledge base home card.
- Reuse the same checked synced leaf scope, remote freshness fetch, persistence, and reload flow as the existing bulk refresh path.
- Preserve the current **全部刷新** behavior as the non-forced, conditional-alignment variant.
- Make the backend manifest-alignment path explicitly support both conditional and forced modes.

**Non-Goals:**

- Re-downloading document bodies or creating sync tasks.
- Expanding the scope beyond currently checked synced document and bitable leaves.
- Creating manifest rows for never-synced documents.

## Decisions

1. **Use one frontend action helper with an explicit mode**
   `HomePage` will keep the existing checked synced leaf selection and batch freshness request, but route both toolbar buttons through one helper that receives `force: boolean`. This avoids duplicating fetch/persist/reload logic while still giving the user two clearly labeled actions and distinct success messages.

2. **Parameterize manifest alignment instead of duplicating commands**
   The current Tauri command `align_document_sync_versions` and storage helper will accept a force flag. In normal mode, the existing predicate stays unchanged. In force mode, every successful freshness result for an existing manifest row rewrites local `version` and `update_time` from the remote side, even when the local version is higher, lower, empty, or just different.

3. **Keep error handling non-destructive**
   Forced alignment still must not touch manifest rows for freshness entries that failed (`status == error` or `error` present). A failed lookup means the app does not have trustworthy remote metadata, so the local manifest should remain untouched.

4. **Normalize returned freshness rows after alignment**
   After either alignment mode updates a manifest row, the returned freshness entry should be rewritten so `local_version` / `local_update_time` reflect the saved manifest values. In force mode this makes the tree immediately display matching local/remote labels after reload, without needing a second refresh pass.

## Risks / Trade-offs

- **Users may confuse the two toolbar actions** -> Keep labels explicit and preserve the existing `全部刷新` behavior, so only the new `强制更新` button performs the aggressive overwrite.
- **Force mode can show metadata as up to date without re-downloading content** -> This is intentional per the task wording; both spec and success messaging should keep the scope framed as metadata alignment only.
- **Remote version may be blank** -> Force mode will still mirror the refreshed remote metadata exactly, which can clear local version labels; this matches the requested "以远端为准" behavior.
