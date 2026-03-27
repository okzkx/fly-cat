## 1. Selection Model

- [x] 1.1 Generalize selected-source normalization and ancestor-coverage helpers so folder roots and document roots can coexist in one same-space source set without redundant descendants.
- [x] 1.2 Keep task creation and summary generation backward-compatible while adding mixed folder/document source descriptions and trustworthy effective document counts.

## 2. Tree Interaction

- [x] 2.1 Update the home-page knowledge-base tree so folder nodes can be checked as explicit sync roots while space nodes remain single-scope entry points and bitable nodes stay unavailable.
- [x] 2.2 Update checkbox disabled-state and cross-space replacement feedback so descendants covered by a selected folder or document subtree cannot be redundantly selected.

## 3. Validation

- [x] 3.1 Add automated coverage for folder-inclusive source normalization, overlap deduplication, and mixed-source selection summaries.
- [x] 3.2 Add automated coverage for tree interaction behavior when selecting folders, descendant documents, and cross-space replacements.
- [x] 3.3 Validate single-document sync, folder-root sync, mixed folder-and-document sync, and task-history summary rendering with focused typecheck, Vitest, and Rust unit-test coverage.
