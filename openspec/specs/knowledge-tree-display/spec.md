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

The system MUST provide labeled controls on the knowledge base home card (same surface as **批量删除** and **开始同步**) for the **currently checked document/bitable leaves that already have sync status `synced`**:

- **全部刷新** refreshes remote document metadata for the checked synced leaves and keeps the existing conditional local-version alignment rule. It MUST NOT delete local files or start a sync task.
- **强制更新** MUST delete local on-disk outputs (exported document files and their recorded image assets) for the checked synced leaves, refresh remote metadata, align local manifest-backed version metadata to the refreshed remote metadata with the forced rule, then start a sync task using the same effective selection as **开始同步** so the pipeline re-pulls from Feishu. If a sync task is already `pending` or `syncing`, **强制更新** MUST NOT start another task and MUST surface a clear error. If there is no effective sync selection, **强制更新** MUST still perform strip + metadata steps but MUST NOT create a sync task and MUST warn the user to choose a scope and use **开始同步**.

For each checked synced leaf whose primary exported file is Markdown (`.md`), **强制更新** MUST also remove a sibling directory under the same parent folder whose name equals that file’s stem (filename without extension) when that path exists and is a directory. This matches the wiki layout where child documents are written under `Title/` next to `Title.md`, so child outputs are cleared and the sync pipeline re-downloads them instead of skipping as unchanged.

Both controls MUST use the same batch freshness API and persistence flow as the automatic debounced freshness pass for the selected synced document ids. Both controls MUST be disabled when sync cannot run (no usable sync root or connection state disallows sync, matching existing **开始同步** gating) or when there are zero checked synced leaves. While either action is in progress, the triggering control MUST show a loading state and MUST NOT start overlapping refresh calls.

After **全部刷新** completes, the system MUST align the local version metadata for each selected synced document with the refreshed remote version metadata only when any of the following is true:

- the local version is lower than the remote version
- the local version is missing while the remote version exists
- the remote version is missing while the local version exists

After **强制更新** completes its metadata phase, the system MUST align the local version metadata for each selected synced document with the refreshed remote version metadata whenever the refresh succeeds, regardless of whether the local version is lower, higher, missing, or simply different.

#### Scenario: User refreshes checked synced documents

- **WHEN** the user activates **全部刷新** and at least one checked leaf document has sync status `synced` and `canRunSync` is true
- **THEN** the system fetches remote freshness for the checked synced document ids, updates the in-memory freshness map, persists metadata, and updates manifest-backed local version state only for the selected synced documents that satisfy the normal alignment rule

#### Scenario: Force update strips local files and starts sync

- **WHEN** the user completes **强制更新** successfully, no sync task is `pending` or `syncing`, and the user has a non-empty effective sync selection
- **THEN** the system deletes local outputs for the checked synced documents, refreshes and persists metadata with forced manifest alignment, refreshes sync statuses, and creates and starts a sync task from the current effective selection

#### Scenario: Force update removes wiki child output directory next to Markdown parent

- **GIVEN** a checked synced wiki/Markdown document whose manifest `output_path` is `…/Parent.md` and a directory `…/Parent/` exists containing child-synced Markdown files
- **WHEN** the user runs **强制更新** for that document
- **THEN** the system removes `…/Parent.md`, recorded image assets for that document, and recursively removes `…/Parent/` so subsequent sync does not skip child documents solely because unchanged local files remain

#### Scenario: Force update blocked by active sync

- **WHEN** a sync task is already `pending` or `syncing`
- **THEN** **强制更新** is disabled

#### Scenario: Force update with no effective selection

- **WHEN** the user completes **强制更新** strip and metadata steps but `effectiveSelectedSources` is empty
- **THEN** the system does not create a sync task and warns the user

#### Scenario: No checked synced documents

- **WHEN** no checked leaf document has sync status `synced`
- **THEN** both **全部刷新** and **强制更新** are disabled

#### Scenario: Sync unavailable

- **WHEN** the connection or sync root is not usable for sync (same conditions under which **开始同步** is disabled for connectivity/root reasons)
- **THEN** both **全部刷新** and **强制更新** are disabled

#### Scenario: Per-row re-sync remains separate

- **WHEN** the user uses **全部刷新**
- **THEN** the system does not create a sync task or re-download bodies (full re-download remains **强制更新** or per-row re-sync)

### Requirement: Missing local outputs clear synced state
The knowledge tree MUST treat a document or bitable as currently synced only when its manifest-backed successful sync record still points to an existing local output file. If the local output has been deleted after a previous success, the tree MUST stop showing `已同步` for that item and MUST fall back to the unsynced presentation until a later sync writes the file again.

#### Scenario: Force update strips local output before re-sync starts
- **WHEN** a previously synced document keeps its manifest success row but its local output file has just been removed by **强制更新**
- **THEN** the knowledge tree shows that document as `未同步` instead of `已同步`

#### Scenario: Aggregate node stops counting deleted child as synced
- **WHEN** a folder or space contains a child document whose manifest row says success but whose local output file is missing
- **THEN** aggregate sync badges do not count that child toward synced totals

#### Scenario: Re-sync restores synced state after file is written again
- **WHEN** a later sync run rewrites the missing local output for that document successfully
- **THEN** the knowledge tree returns to showing `已同步` for that item

