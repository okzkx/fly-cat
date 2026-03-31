## 1. Discovery Retry Handling

- [x] 1.1 Add bounded rate-limit retry logic for Feishu document summary requests used during sync-task discovery.
- [x] 1.2 Keep non-throttling document-info failures failing immediately so discovery still surfaces real permission or payload issues.

## 2. Regression Coverage

- [x] 2.1 Add or update backend tests that cover `code=99991400` document-info throttling in discovery.
- [x] 2.2 Validate the change with focused Rust checks/tests and confirm the OpenSpec change validates cleanly.
