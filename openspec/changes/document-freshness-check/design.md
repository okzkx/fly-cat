## Context

The Rust backend already stores per-document metadata (`ManifestRecord`) with `version`, `update_time`, `content_hash`, `source_signature`, and `last_synced_at` fields in `.feishu-sync-manifest.json`. The `is_document_unchanged` function in `commands.rs` already compares remote `version` + `update_time` against the local manifest to decide whether to skip a document during sync. The `FeishuOpenApiClient.fetch_document_summary` method can retrieve the latest `version` and `update_time` from the Feishu API for any document.

What is missing is an explicit Tauri command that the frontend can call on demand to batch-check freshness for a list of document IDs, returning structured per-document results. This enables pre-sync visibility into which documents have changed.

## Goals / Non-Goals

**Goals:**
- Provide a `check_document_freshness` Tauri command that accepts `document_ids: Vec<String>` and `sync_root: String`, fetches remote metadata for each document, and returns per-document freshness status.
- Support three freshness states: `current` (version matches), `updated` (remote version differs), `new` (not in local manifest).
- Add corresponding TypeScript types so the frontend can consume results.

**Non-Goals:**
- Modifying the existing sync pipeline skip logic (`is_document_unchanged`).
- Adding background polling or automatic freshness detection.
- Changing the manifest format or persistence mechanism.
- Adding frontend UI components that consume the freshness results (that is a separate change).

## Decisions

1. **Reuse `fetch_document_summary` for remote metadata**: The existing `FeishuOpenApiClient.fetch_document_summary` already retrieves `version` and `update_time` from the Feishu `/docx/v1/documents/{id}` endpoint. The new command calls this per document and compares against the manifest. No new API calls are invented.

2. **Compare using `version` and `update_time` together**: This is the same heuristic used by `is_document_unchanged`. Both fields must match for a document to be considered `current`. If either differs, the document is `updated`.

3. **Return a map keyed by document ID**: The command returns `HashMap<String, DocumentFreshnessResult>` where each result contains `status` ("current", "updated", "new"), `localVersion`, `remoteVersion`, `localUpdateTime`, `remoteUpdateTime`. This gives the frontend enough context to display meaningful status.

4. **Run as an async command**: Since each document requires a network call to Feishu API, the command is `async` and runs on a background thread via `tokio::task::spawn_blocking`, consistent with other network-bound commands like `list_space_source_tree`.

5. **Fail individual documents, not the whole batch**: If fetching metadata for one document fails (network, permission), that document gets status `"error"` with a message, while other documents continue processing. This prevents one bad document from blocking the entire batch.

## Risks / Trade-offs

- **[Risk] Per-document API calls may be slow for large batches** -> Mitigation: Document discovery already fetches `version`/`update_time` for all documents. For the freshness check use case, the frontend typically calls this with a small set (visible tree nodes). Future optimization could batch via a shared discovery result if needed.
- **[Risk] Rate limiting by Feishu API** -> Mitigation: The command processes documents sequentially without parallelism. If the document list is large, callers should paginate.
