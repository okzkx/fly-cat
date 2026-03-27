## 1. Selection Model And Task Contract

- [x] 1.1 Replace the single-scope sync input model with a normalized selected-sources contract that can represent multiple document selections from one knowledge base while remaining backward-compatible with existing tasks.
- [x] 1.2 Update task creation, persistence, and browser/Tauri runtime adapters to store selected-source summaries, selected document counts, and compatibility fallbacks for legacy `selectedScope` records.

## 2. Multi-Select Sync Flow

- [x] 2.1 Update the home-page knowledge base tree interaction so document nodes support same-knowledge-base multi-selection while existing whole-space, folder, and single-document sync entry points remain usable.
- [x] 2.2 Update sync creation and backend discovery/planning logic to build a deduplicated document queue from the explicit selected document set and reject or clear invalid cross-knowledge-base multi-selections.
- [x] 2.3 Update the home-page summary and task-list/history presentation to show multi-document selection mode, selected knowledge base context, and trustworthy document-count or path previews.
- [x] 2.4 Add a one-click action for parent documents with descendants so the parent document and all child documents can be added to the current selection set together.

## 3. Validation

- [x] 3.1 Add automated coverage for multi-document tree selection state, selected-source serialization, planner deduplication, and legacy task fallback behavior.
- [x] 3.2 Manually validate single-scope sync, same-knowledge-base multi-document sync, task history rendering, and invalid cross-knowledge-base selection handling.
- [x] 3.3 Add automated coverage for one-click parent-document subtree selection and same-space selection merging behavior.
