## Context

`HomePage.handleBulkFreshnessAction("refresh")` was enqueueing `prepareForceRepulledDocuments` plus `onCreateTask` for documents where `freshnessNeedsResync` was true. That treats **全部刷新** like a mini **强制更新**, which violates the product split: metadata-only reconciliation vs body re-pull.

## Goals / Non-Goals

**Goals:**

- **全部刷新**: `check_document_freshness` → persist freshness → `align_document_sync_versions(..., force: true)` for the checked ids so manifest `version` / `update_time` match the freshly fetched remote fields when the check succeeds. No strip, no sync task.
- Document that **开始同步** only downloads documents that fail the existing `is_document_unchanged` predicate (not already **已同步** with outputs present); skipped docs are not manifest-updated for drift-only cases.

**Non-Goals:**

- Changing per-row **重新同步**, **强制更新**, or backend discovery/skip predicates beyond spec clarification.
- Tooltip copy (explicitly out of scope for this task).

## Decisions

1. **Reuse `align_document_sync_versions` with `force: true` for the refresh path** so any local vs remote revision/update-time mismatch after a successful check is written back to the manifest, matching the user-facing phrase “与远端版本同步” and the same alignment semantics already used after **强制更新**’s metadata phase (without stripping files).
2. **Do not add new Tauri commands**; behavior change is confined to the refresh branch in `HomePage.tsx`.

## Risks / Trade-offs

- **Forced alignment when local manifest revision is higher than remote** (unusual but possible) → same trade-off already accepted for **强制更新** metadata alignment; user explicitly asked for remote-aligned version state from **全部刷新**.

## Migration Plan

None; shipped as a frontend behavior fix with spec sync on archive.

## Open Questions

(none)
