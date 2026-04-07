## Context

Sync-task creation discovers every document covered by the checked knowledge-base sources before any download work starts. The wiki child-node API already returns `title`, `revision/version`, and `update_time` fields for document nodes, but the current discovery code still issues `fetch_document_summary_with_retry()` for each discovered document. On large spaces this creates an avoidable request burst against the Feishu document-info endpoint and makes `99991400` throttling much more likely.

## Goals / Non-Goals

**Goals:**
- Reduce discovery-time document-info traffic without changing the visible sync-task UX.
- Keep incremental sync planning accurate by continuing to populate queue entries with title, version, and update time.
- Preserve the existing document-summary retry path as a fallback when wiki-node metadata is incomplete.

**Non-Goals:**
- Introducing a persistent local discovery queue or background scheduler.
- Changing sync execution order after discovery finishes.
- Reworking unrelated freshness or content-fetch request paths.

## Decisions

Reuse wiki node metadata for discovery queue construction when it is complete.
Rationale: the required planning fields are already present on `FeishuWikiNode`, so discovery can avoid the extra document-info round-trip for the common case.

Fallback to `fetch_document_summary_with_retry()` only when wiki node metadata is incomplete.
Rationale: this keeps the queue builder resilient to missing or malformed upstream fields without regressing the earlier `99991400` retry fix.

Keep the change scoped to discovery queue construction in `commands.rs`.
Rationale: the production symptom reported here is the sync-task discovery burst, so a targeted reduction in request volume is safer than broad cross-cutting throttling changes.

## Risks / Trade-offs

- Wiki node metadata could differ from the document-summary response in edge cases -> fallback remains available when key fields are missing, and later sync/content paths still use their own authoritative fetches.
- Selected single-document sync still uses a direct summary lookup for the root item -> this preserves current behavior while still removing the high-volume per-descendant burst that causes the reported failures.
