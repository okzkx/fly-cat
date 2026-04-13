## Approach

### Tree merge

After the OpenAPI child listing for a `(space_id, parent_node_token)` pair succeeds, load the sync manifest from the resolved sync root (when configured). For each manifest record with `status == success`, an on-disk output file, matching `space_id`, and `path_segments` that are exactly one segment deeper than the resolved parent folder path, insert a synthetic `KnowledgeBaseNode` when its `document_id` is not already present among the remote children. Synthetic nodes reuse manifest `title`, `node_token`, `path_segments`, `display_path`, and carry `local_only_not_on_remote: true` for the UI.

### Discovery and sync

- Extend `discover_documents_from_sources` with access to the task sync root manifest. When a selected document or bitable scope cannot be resolved via Feishu APIs but a qualifying manifest row exists, emit a `SyncSourceDocument` flagged for cleanup-only processing instead of failing discovery.
- After normal discovery for folder and space scopes, append cleanup documents for manifest rows with local files in the selected subtree whose `document_id` was never returned by remote discovery for this task.
- In the sync worker, short-circuit cleanup-only documents: delete outputs and related assets, remove manifest rows, count as success, and skip OpenAPI/MCP content pulls.

### API surface

- Pass optional `syncRoot` into `list_space_source_tree` from the frontend when the user has a resolved output directory so the backend can read the manifest. When absent, behavior matches the previous remote-only tree.

## Risks

- If discovery incorrectly omits a remote document while the manifest still lists it, a broad folder selection could queue cleanup. Mitigation: only append cleanup rows when the document id is missing from the merged discovery set for the current task, which is built from successful OpenAPI walks for the selected scopes.

## Testing

- `cargo test` for new pure helpers (path matching and merge ordering).
- Manual: remove a wiki node in Feishu, confirm the leaf reappears under the expected parent with a local-only marker, select it, run sync, confirm files and manifest rows disappear.
