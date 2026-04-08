## Context

`FeishuOpenApiClient::fetch_document()` drives the Markdown content-fetch path for normal document sync. Before it loads document blocks, it reads document summary metadata through `fetch_document_summary()`. That direct call bypasses the shared `retry_feishu_rate_limited_request()` helper, so a transient Feishu throttle response (`99991400`) still aborts the content-fetch stage even though discovery-stage summary lookups and child-block fetches already have bounded retry behavior.

## Goals / Non-Goals

**Goals:**

- Make content-fetch-stage document-summary requests follow the same bounded throttle retry behavior as the rest of the Feishu content pipeline.
- Preserve fast failure for non-throttling document-summary errors.
- Cover the gap with a focused regression test near the retry helper.

**Non-Goals:**

- Changing retry counts, backoff timing, or throttle detection rules.
- Altering discovery-stage metadata reuse or fallback behavior.
- Refactoring the overall sync pipeline or error classification model.

## Decisions

- **Route `fetch_document()` through `fetch_document_summary_with_retry()`**: this is the smallest fix because the retry helper already encodes the desired behavior for `99991400` without changing callers or error shapes.
- **Leave block fetching logic unchanged**: child-block traversal already has dedicated retry coverage, so this fix only closes the remaining summary-fetch gap at the start of content retrieval.
- **Add a focused unit regression around the content-fetch summary step**: a test should prove that throttled summary attempts are retried before block loading succeeds, avoiding a future regression where `fetch_document()` accidentally reverts to the non-retrying path.

## Risks / Trade-offs

- **Extra delay on repeated throttling** -> Mitigation: reuse the existing bounded retry budget and preserve terminal failure once the budget is exhausted.
- **Potential duplication between retry-path tests** -> Mitigation: keep the new test focused on `fetch_document()` behavior rather than re-testing the helper's internal loop in isolation.
