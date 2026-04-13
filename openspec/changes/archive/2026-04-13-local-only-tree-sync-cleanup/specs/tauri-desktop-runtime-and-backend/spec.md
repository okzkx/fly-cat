## ADDED Requirements

### Requirement: Manifest-aware knowledge tree listing

The `list_space_source_tree` command SHALL accept an optional `sync_root` string. When provided and pointing at a directory containing a readable manifest, the command SHALL merge remote-missing manifest-backed leaves as defined by the `knowledge-tree-display` delta. When omitted or invalid, the command SHALL behave as a remote-only listing.

#### Scenario: Tree listing without sync root

- **WHEN** the client calls `list_space_source_tree` without `sync_root`
- **THEN** the result contains only nodes returned from the Feishu wiki listing APIs

#### Scenario: Tree listing with sync root

- **WHEN** the client calls `list_space_source_tree` with a valid `sync_root` and manifest rows qualify as remote-missing leaves for the requested parent
- **THEN** those leaves appear in the returned JSON with `localOnlyNotOnRemote` true

### Requirement: Discovery emits cleanup work for remote-missing selections

The sync discovery pipeline SHALL include manifest-backed documents that still have local outputs, fall under the user’s selected scopes, and are absent from remote discovery results, marking them for cleanup-only processing in the sync worker.

#### Scenario: Selected orphan document does not fail discovery

- **WHEN** the user selects a document scope whose Feishu metadata APIs fail (for example the document was deleted server-side) but a matching successful manifest row with local output exists under the task output root
- **THEN** discovery still returns a work item for that document that the worker processes as cleanup-only without treating the API failure as a hard discovery error for that selection
