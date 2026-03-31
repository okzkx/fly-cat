## Context

Sync-task creation discovers every document covered by the checked knowledge-base sources before any download work starts. That discovery path repeatedly calls Feishu's document info endpoint through `fetch_document_summary()`, and today any `code=99991400` frequency-limit response immediately aborts the whole discovery run even though other Feishu content-fetch paths already use bounded retry with backoff.

## Goals / Non-Goals

**Goals:**
- Let sync-task discovery recover from transient `99991400` document-info throttling without surfacing a false terminal failure to the user.
- Keep retry behavior bounded and predictable so discovery does not hang indefinitely.
- Preserve existing behavior for non-rate-limit failures such as permission, missing document, or malformed response errors.

**Non-Goals:**
- Retrying every discovery-stage OpenAPI call.
- Changing task-creation UX, progress semantics, or failure presentation.
- Introducing new background workers, queues, or persistent retry state.

## Decisions

Retry only the document summary request path used by sync discovery.
Rationale: the current production symptom is specifically `获取文档信息失败(code=99991400)`, and limiting the fix to that call avoids broad behavioral changes in unrelated discovery requests.

Use the same retry profile already proven for throttled child-block fetches: bounded attempts with exponential backoff and explicit rate-limit detection from the Feishu error payload.
Rationale: this keeps the implementation consistent with existing OpenAPI handling and is sufficient for short-lived throttling bursts during large discovery traversals.

Continue failing fast for non-throttling document info errors.
Rationale: authorization and data-shape problems should remain visible immediately instead of being hidden behind unnecessary retries.

## Risks / Trade-offs

- Discovery can take longer when Feishu is throttling heavily -> bounded retries cap the added delay and still produce a real failure if the limit persists.
- Matching throttling from transport text may miss a future Feishu wording change -> keep detection keyed on the numeric code first and retain existing error visibility if the text changes.
