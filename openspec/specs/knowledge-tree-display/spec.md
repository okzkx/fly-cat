# knowledge-tree-display Specification

## Purpose
TBD - created by archiving change remove-chinese-labels. Update Purpose after archive.
## Requirements
### Requirement: Tree node labels
Tree nodes MUST display the node title alongside a type icon only. The system SHALL NOT render additional text labels (such as Chinese type tags) for the node type.

#### Scenario: Space node rendering
- **WHEN** a space node is rendered in the knowledge tree
- **THEN** it shows a cloud icon and the space title, with no "整库" tag

#### Scenario: Folder node rendering
- **WHEN** a folder node is rendered in the knowledge tree
- **THEN** it shows a folder icon and the folder title, with no "目录" tag

#### Scenario: Document node rendering
- **WHEN** a document node is rendered in the knowledge tree
- **THEN** it shows a file icon and the document title, with no "文档" tag

#### Scenario: Document with descendants
- **WHEN** a document node with `includesDescendants` is rendered in the knowledge tree
- **THEN** it shows a file icon and the document title, with no "含子文档" tag

#### Scenario: Bitable node rendering
- **WHEN** a bitable node is rendered in the knowledge tree
- **THEN** it shows a table icon and the bitable title, with no "多维表格" tag

### Requirement: Metadata display on non-document tree nodes
The system SHALL display sync metadata status tags on ALL tree node types (space, folder, document, bitable), not only document nodes. Space and folder nodes MUST continue to show aggregate status, while document and bitable leaf nodes MUST show their own per-item sync state. When a sync task is active and syncable leaves have been discovered, individual leaf nodes that are in the discovered set but not yet synced MUST display "等待同步" to distinguish them from leaves outside the current sync scope. Aggregate tags on parent nodes (folder, space) MUST reflect the overall sync progress including discovered-but-unsynced leaves.

#### Scenario: Space node with synced and unsynced children
- **WHEN** a space node contains 3 synced and 7 unsynced documents
- **THEN** it shows a tag "3/10 已同步"

#### Scenario: Space node with all children synced
- **WHEN** a space node contains documents where all are synced
- **THEN** it shows a tag "全部已同步"

#### Scenario: Space node with no sync records
- **WHEN** a space node contains documents but none have been synced
- **THEN** it shows a tag "未同步"

#### Scenario: Folder node with partial sync
- **WHEN** a folder node contains 5 synced and 3 unsynced documents
- **THEN** it shows a tag "5/8 已同步"

#### Scenario: Bitable node metadata
- **WHEN** a bitable node is rendered in the knowledge tree
- **THEN** it shows the same per-item sync-state pattern as a document leaf rather than a permanent unsupported tag

#### Scenario: Bitable node with active sync on sibling documents
- **WHEN** a sync task is active with discovery completed and a bitable node is in the discovered set but has no manifest status entry yet
- **THEN** the bitable node shows a neutral "等待同步" tag

#### Scenario: Bitable node transitions to synced
- **WHEN** a previously discovered bitable node completes synchronization successfully
- **THEN** the bitable node shows a success tag "已同步" with the sync timestamp

#### Scenario: Bitable node transitions to failed
- **WHEN** a previously discovered bitable node fails during synchronization
- **THEN** the bitable node shows a tag "同步失败" in an error style

#### Scenario: Document node discovered but not yet synced
- **WHEN** a sync task is active with document discovery completed and a document node is in the discovered set but has no manifest status entry
- **THEN** the document node shows a tag "等待同步" in a default/neutral style

#### Scenario: Document node transitions from waiting to synced
- **WHEN** a document previously shown as "等待同步" completes syncing and the manifest is updated
- **THEN** the document node shows a tag "已同步" with the sync timestamp

#### Scenario: Document node transitions from waiting to failed
- **WHEN** a document previously shown as "等待同步" fails syncing
- **THEN** the document node shows a tag "同步失败" in an error style

#### Scenario: Folder node shows syncing progress when children are discovered
- **WHEN** a sync task is active and a folder node's descendant documents have been discovered
- **THEN** the folder node shows a tag "同步中 X/Y" where X is the number of processed documents and Y is the total discovered document count

#### Scenario: Folder node all children waiting to sync
- **WHEN** a sync task is active with discovery completed but no descendant documents of a folder node have been synced yet
- **THEN** the folder node shows a tag "同步中 0/Y" reflecting that 0 of Y discovered documents have been processed

### Requirement: Document and bitable nodes show local and remote Feishu revision labels

When the app runs in Tauri with a configured sync root and document sync statuses are loaded, each **document** and **bitable** tree node SHALL display secondary text immediately after the node title (same title row) in the form `本地 <local> / 远端 <remote>`, where `<local>` and `<remote>` are Feishu revision identifiers or an em dash `—` when unknown.

- **Local** SHALL be the manifest revision for that document when present in sync statuses; otherwise `—`.
- **Remote** SHALL prefer the persisted freshness check remote revision for that document when non-empty; otherwise SHALL use the wiki child-node list revision carried on the tree node when non-empty; otherwise `—`.

In browser (non-Tauri) runtime or when sync statuses are empty, the system SHALL NOT render this revision line.

#### Scenario: Synced document with manifest and freshness

- **GIVEN** Tauri runtime, sync root configured, document `doc-1` has sync status with local Feishu revision `rev-a` and freshness metadata with remote revision `rev-b`
- **WHEN** the tree renders the document node for `doc-1`
- **THEN** it shows secondary text `本地 rev-a / 远端 rev-b` after the title

#### Scenario: Never-synced document with list revision only

- **GIVEN** Tauri runtime, sync root configured, document `doc-2` has no manifest status entry, tree node carries wiki list revision `rev-list`, and no freshness row for `doc-2`
- **WHEN** the tree renders the document node for `doc-2`
- **THEN** it shows secondary text `本地 — / 远端 rev-list`

#### Scenario: Browser mode

- **GIVEN** browser runtime (no Tauri)
- **WHEN** the tree renders any document node
- **THEN** no local/remote revision line is shown

### Requirement: Bulk remote freshness refresh

The system MUST provide a labeled control on the knowledge base home card (same surface as **批量删除** and **开始同步**) that refreshes remote document metadata for **all** documents currently in sync status `synced`. The implementation MUST use the same batch freshness API and persistence as the automatic debounced freshness pass (`checkDocumentFreshness` followed by `saveFreshnessMetadata` for the active sync root). The control MUST be disabled when sync cannot run (no usable sync root or connection state disallows sync, matching existing **开始同步** gating) or when there are zero synced documents. While a refresh is in progress, the control MUST show a loading state and MUST NOT start overlapping refresh calls.

#### Scenario: User refreshes all synced documents

- **WHEN** the user activates the bulk freshness control and at least one document has sync status `synced` and `canRunSync` is true
- **THEN** the system fetches remote freshness for all such document ids, updates the in-memory freshness map, persists metadata, and shows a success confirmation

#### Scenario: No synced documents

- **WHEN** no document has sync status `synced`
- **THEN** the bulk freshness control is disabled

#### Scenario: Sync unavailable

- **WHEN** the connection or sync root is not usable for sync (same conditions under which **开始同步** is disabled for connectivity/root reasons)
- **THEN** the bulk freshness control is disabled

#### Scenario: Does not replace per-row re-sync

- **WHEN** the user uses the bulk freshness control
- **THEN** the system does not create a sync task or re-download document bodies (that remains the per-row re-sync control)

