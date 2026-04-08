## 1. Backend pacing

- [x] 1.1 In `check_document_freshness`, use `fetch_document_summary_with_retry` instead of `fetch_document_summary` for docx-path documents.
- [x] 1.2 Add a fixed minimum delay between consecutive docx summary API calls (skip for `export:` rows and before the first docx call).

## 2. Frontend queue and UI

- [x] 2.1 Serialize all `checkDocumentFreshness` (+ follow-up save) invocations from `HomePage` through one Promise chain.
- [x] 2.2 Extend `FreshnessIndicator` (and title props) so synced leaves without a freshness row show **待检查** when idle and a loading icon while a batch is running.

## 3. Validation

- [x] 3.1 `cargo check` / tests for `src-tauri` as appropriate.
- [x] 3.2 `openspec validate "serial-document-freshness-check-pending-icon"`.
