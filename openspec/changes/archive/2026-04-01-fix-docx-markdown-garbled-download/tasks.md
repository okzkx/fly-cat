## 1. Reproduce And Scope

- [x] 1.1 Confirm the current garbled-download behavior against a real synced Markdown path and identify the sync branch that produced it
- [x] 1.2 Document the root cause in the change artifacts and align the affected specs

## 2. Fix Sync Branch Selection

- [x] 2.1 Restrict export-task downloads to export-only object types during sync execution
- [x] 2.2 Add focused regression coverage for Markdown documents versus export-only items

## 3. Validate

- [x] 3.1 Run targeted Rust and project validation for the changed sync behavior
- [x] 3.2 Re-check the affected sample path behavior to confirm the fix direction
