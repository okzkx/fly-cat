## Context

`retry_feishu_rate_limited_request` in `src-tauri/src/mcp.rs` backs document metadata fetches (`fetch_document_summary_with_retry`) and throttled block reads. Each intermediate throttle hit prints `eprintln!` with a `[warn]` prefix, which the Tauri/dev console surfaces as noisy warnings.

## Goals / Non-Goals

**Goals:**

- Remove per-attempt warning spam for expected Feishu frequency-limit responses while retries remain available.
- Keep exhaustion and non-throttle errors visible and unchanged in severity where they already warn.

**Non-Goals:**

- Changing retry counts, backoff durations, or which HTTP/API errors qualify as throttled.
- Replacing `eprintln!` with a full logging framework.

## Decisions

- **Drop intermediate `[warn]` lines** for throttled responses when `attempt + 1 < attempts`. Retries and backoff stay the same; only console output changes.
- **Keep the exhaustion message** when the last attempt still returns throttle (`[warn] … 限频重试耗尽`).
- **No substitute `debug` spam** by default, so bulk sync stays quiet unless developers add their own tracing later.

## Risks / Trade-offs

- **Less live visibility into retry progress** → Mitigation: exhaustion still warns; successful completion needs no per-attempt log.
