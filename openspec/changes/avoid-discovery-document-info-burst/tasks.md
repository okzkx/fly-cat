## 1. Discovery Queue Request Reduction

- [x] 1.1 Reuse wiki child-node metadata for document queue entries during discovery when title/version/update_time are already present.
- [x] 1.2 Keep document-summary lookup as a fallback only for incomplete wiki-node metadata so discovery stays resilient.

## 2. Validation

- [x] 2.1 Add or update backend tests that cover the metadata reuse and fallback decision.
- [x] 2.2 Validate the change with focused Rust checks/tests and confirm the OpenSpec change validates cleanly.
