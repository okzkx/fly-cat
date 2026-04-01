## Context

`HomePage` already loads persisted freshness via `loadFreshnessMetadata` and, in a debounced `useEffect`, calls `checkDocumentFreshness(syncedIds, syncRoot)` and `saveFreshnessMetadata` when `documentSyncStatuses` or `syncRoot` change. The backend command `check_document_freshness` is unchanged.

## Goals / Non-Goals

**Goals:**

- Expose one user-triggered path that runs the same ID list and persistence as the automatic check.
- Disable the control when sync cannot run (`canRunSync`) or when there are no synced document ids.
- Show in-button loading while the batch request runs.

**Non-Goals:**

- Refreshing documents that are not yet synced (no manifest row to compare meaningfully in the same way as “synced” leaves).
- Replacing or removing the debounced automatic check.
- Bulk re-download / re-sync (that remains per-row **重新同步**).

## Decisions

1. **Reuse the same ID set as the effect**: `Object.keys(documentSyncStatuses).filter((id) => documentSyncStatuses[id]?.status === "synced")`.
2. **Placement**: Card `extra` toolbar next to **批量删除** / **开始同步**, labeled **全部刷新** with `ReloadOutlined` for consistency with refresh semantics (per-row sync uses icon-only + tooltip to disambiguate).
3. **Feedback**: `message.success` on success; existing `message` / `console.error` pattern on failure.
