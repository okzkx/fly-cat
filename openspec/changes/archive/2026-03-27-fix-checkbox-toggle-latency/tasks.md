## 1. Selection Interaction Fix

- [x] 1.1 Remove eager subtree loading from document checkbox toggles so selection updates stay local and immediate.
- [x] 1.2 Keep tree child loading scoped to explicit node expansion while preserving descendant-coverage selection behavior for loaded nodes.

## 2. Regression Coverage

- [x] 2.1 Add or update tests to verify checkbox toggles do not trigger recursive knowledge-base discovery requests.
- [x] 2.2 Run targeted validation for the updated tree-selection behavior and confirm the affected tests pass.
