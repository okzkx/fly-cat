## 1. Selection Model

- [x] 1.1 Update selection-related types and utilities so selected document sources represent document subtree roots, can detect ancestor-covered descendants, and remain backward-compatible with legacy task data.
- [x] 1.2 Add tree-selection helpers that resolve descendant coverage for selected roots, compute disabled descendant checkboxes, and normalize overlapping or cross-knowledge-base document-root selections.

## 2. Sync Flow Implementation

- [x] 2.1 Update the home-page knowledge base tree so checking a parent document selects its full subtree by default, descendant document checkboxes become unavailable while covered, and the separate “一键选中父子文档” action is removed.
- [x] 2.2 Update sync task creation, browser/runtime planning, and task/history summary rendering so document subtree roots expand into deduplicated document queues and display subtree-aware source summaries.

## 3. Validation

- [x] 3.1 Add automated coverage for subtree-root selection state, descendant disable behavior, overlapping-root deduplication, and subtree-aware summary/task fallback behavior.
- [ ] 3.2 Manually validate leaf-document sync, parent-document subtree sync, same-knowledge-base multi-root sync, cross-knowledge-base switching, and task-list source-summary rendering.
