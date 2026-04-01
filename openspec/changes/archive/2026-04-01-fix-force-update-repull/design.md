## Context

Bulk **强制更新** shares freshness fetch and `align_document_sync_versions(..., force: true)` with **全部刷新**, but never removes exported files or enqueues sync work. The sync skip predicate only compares manifest fields to discovered API metadata, so after a forced alignment the document can still be treated as unchanged and skipped even if the user wanted a full re-pull.

## Goals / Non-Goals

**Goals:**

- Delete local document outputs (and sidecar image assets) for the checked synced document ids before re-pulling.
- Ensure the sync runner will not skip documents whose output file is missing.
- After strip + metadata refresh, automatically start one sync task using the same effective selection as **开始同步**, when no other task is already pending or syncing.

**Non-Goals:**

- Changing **全部刷新** (still metadata-only, no sync task).
- New per-document scope discovery beyond existing task creation rules.

## Decisions

1. **Strip command reuses removal mechanics but keeps manifest rows**  
   Mirror `remove_synced_documents` file deletion (markdown/export file + `image_assets` under the parent of `output_path`), then clear `version`, `update_time`, and `content_hash` on matching records and save the manifest. This avoids losing path/title metadata while forcing the pipeline to reconsider content.

2. **Require on-disk output for “unchanged”**  
   Extend `is_document_unchanged` with `Path::new(&record.output_path).exists()` so missing files always queue for download even when manifest versions match the API.

3. **UI gating**  
   Disable **强制更新** while a sync task is `pending` or `syncing`, same as we avoid overlapping destructive + sync flows. If the user has no effective selection, show a warning and skip task creation after strip (local files are already removed; user must choose scope and sync).

## Risks

- Starting a sync task pulls all documents under the current selection, not only checked leaves; only checked ids are stripped, others keep skip behavior. This matches how **开始同步** already scopes discovery.
