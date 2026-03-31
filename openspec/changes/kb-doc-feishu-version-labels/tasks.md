## 1. Backend types and sync statuses

- [ ] 1.1 Add `local_feishu_version` to `DocumentSyncStatusEntry` and populate from manifest in `get_document_sync_statuses`
- [ ] 1.2 Add `wiki_list_version` to `KnowledgeBaseNode`, set in `build_tree_nodes_from_openapi`, `clone_collapsed_nodes`, and fixtures

## 2. Frontend

- [ ] 2.1 Extend `DocumentSyncStatus` and `getDocumentSyncStatuses` typing; add `wikiListVersion?` on `KnowledgeBaseNode`
- [ ] 2.2 Pass `wikiListVersion` through `buildTreeNodes`; render local/remote revision line for document and bitable nodes in `HomePage` titleRender

## 3. Verification

- [ ] 3.1 `npx openspec validate --change kb-doc-feishu-version-labels`
- [ ] 3.2 `npm test` and `cargo test` (focused if full suite heavy)
