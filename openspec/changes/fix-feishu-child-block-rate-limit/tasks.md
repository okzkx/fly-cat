## 1. Child-block retry handling

- [x] 1.1 Add rate-limit-aware retry handling around Feishu child-block traversal requests.
- [x] 1.2 Preserve immediate failures for non-retryable child-block errors while surfacing throttling only after the retry budget is exhausted.

## 2. Regression coverage and validation

- [x] 2.1 Add targeted regression coverage for transient `99991400` child-block throttling.
- [x] 2.2 Run focused Rust and OpenSpec validation for the updated content-fetch behavior.
