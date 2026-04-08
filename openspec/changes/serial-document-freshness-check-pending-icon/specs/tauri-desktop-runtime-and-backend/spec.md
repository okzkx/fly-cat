## ADDED Requirements

### Requirement: Document freshness OpenAPI calls are paced and retried

The `check_document_freshness` command MUST process each input document id sequentially inside its blocking worker. For each document that requires a **docx document info / summary** OpenAPI round-trip (non-`export:` manifest records), the implementation MUST call the same retry-wrapped helper used elsewhere for document summary (`fetch_document_summary_with_retry` or equivalent), and MUST insert a fixed minimum delay between the **start** of one such OpenAPI request and the **start** of the next (skipping the delay before the first docx request in the batch). Export-only records MUST NOT trigger docx summary calls or this inter-request delay.

#### Scenario: Spacing between docx summary calls

- **WHEN** the batch contains at least two document ids that both require a docx summary API call
- **THEN** the second call’s request MUST NOT begin until at least the configured minimum interval after the first call’s request has begun

#### Scenario: Throttle-aware retry

- **WHEN** the Feishu API returns a recognized frequency-limit response for a document summary call inside `check_document_freshness`
- **THEN** the command uses the shared throttle retry helper with backoff before surfacing a terminal error for that document
