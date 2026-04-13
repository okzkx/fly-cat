## 1. Specification and types

- [x] 1.1 Add `localOnlyNotOnRemote` (optional, default false) to the shared `KnowledgeBaseNode` type for the frontend.
- [x] 1.2 Extend `SyncSourceDocument` in Rust with a cleanup-only flag defaulting to false.

## 2. Backend tree merge

- [x] 2.1 Add optional `sync_root` to `list_space_source_tree`, resolve manifest path, and merge remote-missing manifest leaves after OpenAPI listing.
- [x] 2.2 Update the local agent route to forward `sync_root` when present.

## 3. Discovery and sync worker

- [x] 3.1 Thread the task output manifest into `discover_documents_from_sources`, add manifest fallbacks for failed document or bitable lookups, and append folder or space scoped orphan rows missing from the remote discovery set.
- [x] 3.2 Handle cleanup-only documents in the sync worker by deleting outputs and manifest rows and counting successes without running content sync.

## 4. Frontend wiring

- [x] 4.1 Pass the resolved sync root from `App` into `listKnowledgeBaseNodes` / `list_space_source_tree` so merges occur whenever a destination is configured.

## 5. Validation

- [x] 5.1 Run `openspec validate --change "local-only-tree-sync-cleanup"`.
- [x] 5.2 Run `cargo test` (or targeted crate tests) after implementation.
