## Context

Image-heavy Feishu documents trigger repeated child-block fetches while the sync pipeline walks the block tree. Today `src-tauri/src/mcp.rs` stops traversal on the first child-block OpenAPI failure, so transient Feishu frequency-limit responses (`code=99991400`) abort the whole content fetch even when the document would succeed on a short retry.

## Goals / Non-Goals

**Goals:**
- Retry child-block OpenAPI requests when Feishu returns its transient frequency-limit error during block traversal.
- Keep successful traversal behavior unchanged for normal responses.
- Preserve a final content-fetch failure when the retry budget is exhausted or the error is not retryable.

**Non-Goals:**
- Do not redesign the overall traversal order or move the pipeline to async execution.
- Do not add generic retry handling for every Feishu API call in this change.
- Do not change Markdown rendering, image download paths, or sync task scheduling.

## Decisions

### Limit retries to child-block traversal fetches

The proposal is specifically about repeated child-block requests in deep block trees, so the smallest safe fix is to wrap only `fetch_single_block_json` calls used by recursive traversal. This avoids changing unrelated document summary or export behavior.

### Retry only on the Feishu frequency-limit signature

Retry only when the transport error message contains Feishu's rate-limit code `99991400` or the returned `frequency limit` text. Non-rate-limit failures should still surface immediately so real permission, payload, or connectivity problems are not hidden behind extra delays.

### Use a short bounded backoff

Use a fixed, small retry budget and backoff in the existing synchronous traversal flow. This keeps the implementation simple and gives Feishu enough time to recover from burst throttling without introducing long stalls for permanently failing documents.

## Risks / Trade-offs

- Additional latency on throttled documents -> bound retries and keep backoff short so successful retries do not excessively delay the sync queue.
- Error matching depends on Feishu's current rate-limit signature -> match both the numeric code and message text to reduce brittleness.
- Traversal still fails after repeated throttling -> keep that behavior explicit so the pipeline can report a genuine content-fetch failure after exhausting retries.
