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
The system SHALL display sync metadata status tags on ALL tree node types (space, folder, document, bitable), not only document nodes. Space and folder nodes MUST continue to show aggregate status, while document and bitable leaf nodes MUST show their own per-item sync state. When a sync task is active and syncable leaves have been discovered, individual leaf nodes that are in the discovered set but not yet synced MUST display a **processing**-style tag **「同步中 X/Y」** where X and Y are the active task `counters.processed` and `counters.total`, matching folder aggregate tags during sync. Aggregate tags on parent nodes (folder, space) MUST reflect the overall sync progress including discovered-but-unsynced leaves.

**Document or bitable nodes that have loaded child nodes in the tree** MUST use the same aggregate tagging rules as folder nodes for that subtree (counting descendant document ids, including the parent’s own document id when present), so parent wiki branches show child sync progress consistently with directory nodes.

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
- **THEN** the bitable node shows a processing tag "同步中 X/Y" using the active task counters

#### Scenario: Bitable node transitions to synced
- **WHEN** a previously discovered bitable node completes synchronization successfully
- **THEN** the bitable node shows a success tag "已同步" with the sync timestamp

#### Scenario: Bitable node transitions to failed
- **WHEN** a previously discovered bitable node fails during synchronization
- **THEN** the bitable node shows a tag "同步失败" in an error style

#### Scenario: Document node discovered but not yet synced
- **WHEN** a sync task is active with document discovery completed and a document node is in the discovered set but has no manifest status entry
- **THEN** the document node shows a processing tag "同步中 X/Y" where X and Y are `counters.processed` and `counters.total` of the active task

#### Scenario: Document node transitions from syncing to synced
- **WHEN** a document previously shown as "同步中 X/Y" completes syncing and the manifest is updated
- **THEN** the document node shows a tag "已同步" with the sync timestamp

#### Scenario: Document node transitions from syncing to failed
- **WHEN** a document previously in the active discovered set fails syncing
- **THEN** the document node shows a tag "同步失败" in an error style

#### Scenario: Folder node shows syncing progress when children are discovered
- **WHEN** a sync task is active and a folder node's descendant documents have been discovered
- **THEN** the folder node shows a tag "同步中 X/Y" where X is the number of processed documents and Y is the total discovered document count

#### Scenario: Folder node all children waiting to sync
- **WHEN** a sync task is active with discovery completed but no descendant documents of a folder node have been synced yet
- **THEN** the folder node shows a tag "同步中 0/Y" reflecting that 0 of Y discovered documents have been processed

#### Scenario: Parent document with loaded children uses aggregate progress
- **WHEN** a document node has one or more loaded child nodes in the tree and a sync task is active affecting descendants in the discovered set
- **THEN** the document node shows the same aggregate sync tag behavior as a folder node (including "同步中 X/Y" when any descendant is in the syncing set)

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
- **强制更新** MUST delete local on-disk outputs (exported document files and their recorded image assets) for the checked synced leaves, immediately refresh the in-memory manifest-backed sync status view so those stripped leaves render as `未同步`, refresh remote metadata, align local manifest-backed version metadata to the refreshed remote metadata with the forced rule, then start a sync task using the same effective selection as **开始同步** so the pipeline re-pulls from Feishu. If a sync task is already `pending` or `syncing`, **强制更新** MUST NOT start another task and MUST surface a clear error. If there is no effective sync selection, **强制更新** MUST still perform strip + metadata steps but MUST NOT create a sync task and MUST warn the user to choose a scope and use **开始同步**.

For each checked synced leaf whose primary exported file is Markdown (`.md`), **强制更新** MUST also remove a sibling directory under the same parent folder whose name equals that file’s stem (filename without extension) when that path exists and is a directory. This matches the wiki layout where child documents are written under `Title/` next to `Title.md`, so child outputs are cleared and the sync pipeline re-downloads them instead of skipping as unchanged.

Both controls MUST use the same batch freshness API and persistence flow as the automatic debounced freshness pass for the selected synced document ids. Both controls MUST be disabled when sync cannot run (no usable sync root or connection state disallows sync, matching existing **开始同步** gating) or when there are zero checked synced leaves. While either action is in progress, the triggering control MUST show a loading state and MUST NOT start overlapping refresh calls.

After **全部刷新** completes, the system MUST align the local version metadata for each selected synced document with the refreshed remote version metadata only when any of the following is true:

- the local version is lower than the remote version
- the local version is missing while the remote version exists
- the remote version is missing while the local version exists

After **强制更新** completes its metadata phase, the system MUST align the local version metadata for each selected synced document with the refreshed remote version metadata whenever the refresh succeeds, regardless of whether the local version is lower, higher, missing, or simply different.

When **强制更新** has already queued a replacement sync task for a non-empty effective selection, the Home page task summary and the task list MUST show that pending task immediately, without waiting for the freshness refresh/alignment phase to finish. Merely queuing that pending task MUST NOT overwrite the freshly stripped leaves back to a syncing badge before the replacement sync actually starts.

#### Scenario: User refreshes checked synced documents

- **WHEN** the user activates **全部刷新** and at least one checked leaf document has sync status `synced` and `canRunSync` is true
- **THEN** the system fetches remote freshness for the checked synced document ids, updates the in-memory freshness map, persists metadata, and updates manifest-backed local version state only for the selected synced documents that satisfy the normal alignment rule

#### Scenario: Force update clears synced badges immediately after strip

- **WHEN** the user runs **强制更新** for checked synced leaves and the local strip step succeeds
- **THEN** those leaves stop rendering as `已同步` immediately and instead render as `未同步` until a replacement sync actually starts for them

#### Scenario: Force update queues task before metadata refresh finishes

- **WHEN** the user runs **强制更新**, the local strip step succeeds, and there is a non-empty effective sync selection
- **THEN** the follow-up sync task appears in the Home page task summary and task list as a pending task before the shared freshness refresh/alignment phase finishes

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

### Requirement: Folder node opens local synced directory with default application

The system SHALL show an actionable control on each **folder** node in the knowledge base tree (alongside the existing type icon and title) that opens the folder’s corresponding path under the configured Markdown sync root using the same OS integration as opening the sync root folder (typically the system file manager via the default application). The resolved filesystem path MUST apply the same path segment sanitization rules as document output paths so that the opened directory matches where synced content for that subtree is written.

#### Scenario: Desktop user opens a folder node

- **WHEN** the application runs in the Tauri desktop runtime and the user activates the folder node’s “open with default application” control
- **THEN** the system invokes the existing workspace-folder open command with the computed absolute directory path for that folder under `syncRoot`

#### Scenario: Local directory missing

- **WHEN** the computed directory does not exist on disk
- **THEN** the system shows a clear error to the user (for example that the directory does not exist and sync may be needed) and does not claim success

#### Scenario: Non-desktop runtime

- **WHEN** the application is not running in the Tauri desktop runtime
- **THEN** the control either is not offered or activation results in the same non-desktop failure feedback pattern as other local folder open actions

### Requirement: Document and bitable nodes open local synced Markdown with default application

The system SHALL show the same style of actionable control used for **folder** nodes’ “open with default application” action on each **document** and **bitable** node in the knowledge base tree (alongside existing per-row actions). Activation SHALL open the Markdown file path under the configured sync root that corresponds to that node’s synced export, using the same path segment sanitization and filename rules as the sync pipeline’s document output mapping.

#### Scenario: Desktop user opens a document node

- **WHEN** the application runs in the Tauri desktop runtime, a sync root is configured, the local exported Markdown file for that document exists, and the user activates the document node’s “open with default application” control
- **THEN** the system opens that file with the OS default application via the same backend opener integration used for opening the sync root folder

#### Scenario: Desktop user opens a bitable node

- **WHEN** the application runs in the Tauri desktop runtime, a sync root is configured, the local exported Markdown file for that bitable exists, and the user activates the bitable node’s “open with default application” control
- **THEN** the system opens that file with the OS default application via the same backend opener integration

#### Scenario: Local Markdown file missing

- **WHEN** the computed Markdown file path does not exist on disk
- **THEN** the system shows a clear error to the user (for example that the file does not exist and sync may be needed) and does not claim success

#### Scenario: Non-desktop runtime

- **WHEN** the application is not running in the Tauri desktop runtime
- **THEN** activation results in the same non-desktop failure feedback pattern as other local folder open actions

### Requirement: Document row separates preview selection from sync checkbox

For document and bitable leaf rows in the knowledge tree, the system SHALL treat **title row selection** (the primary label area used to focus a node) and **checkbox toggling** as independent actions. Clicking the title SHALL NOT change checked state for sync selection. Clicking the checkbox SHALL NOT update the scope used for markdown preview.

#### Scenario: Title click previews without toggling checkbox

- **WHEN** the user clicks the document or bitable node title (not the checkbox) and the node has a valid `scopeValue`
- **THEN** the application SHALL update the focused scope for preview and tree selection highlight as today
- **AND** the checked keys for sync SHALL remain unchanged by that click

#### Scenario: Checkbox toggles sync without opening preview

- **WHEN** the user toggles the sync checkbox on a document or bitable node
- **THEN** the sync selection state SHALL update per existing cascade rules
- **AND** the markdown preview scope SHALL NOT change solely because of that checkbox action

### Requirement: Knowledge tree uses a bounded interactive viewport
The system SHALL render the knowledge tree inside a bounded scrollable viewport on the home card so that expanding large loaded subtrees does not keep increasing the card height indefinitely. When the expanded content exceeds that viewport, scrolling SHALL happen inside the tree region while the rest of the page layout remains stable.

#### Scenario: Expanded tree exceeds viewport height
- **WHEN** the user expands enough loaded nodes that the tree content is taller than the tree region
- **THEN** the tree region becomes internally scrollable instead of growing the card for the full tree height

### Requirement: Knowledge tree rows keep metadata and actions in a stable inline layout
The system SHALL render each non-root knowledge tree row in a stable inline layout that keeps the icon, main title, secondary metadata, status badges, freshness indicator, and per-row actions on a single horizontal row when space allows. Long secondary content SHALL truncate before causing action controls to wrap onto extra lines during expand/collapse.

#### Scenario: Document row with metadata and actions
- **WHEN** a document or bitable node renders revision text, sync status, freshness, and row actions
- **THEN** the row keeps those elements inline and truncates secondary text before wrapping the action controls onto another line

#### Scenario: Folder row with local-open action
- **WHEN** a folder node renders its title, aggregate status, and local-open action
- **THEN** the row keeps the action aligned inline with the title content instead of introducing a wrapped second line during tree expansion

### Requirement: Freshness indicator shows pending and in-flight states

For **document** and **bitable** tree nodes whose sync status is `synced`, the freshness icon area MUST NOT be empty solely because a freshness result row is not yet loaded for that document id.

#### Scenario: Pending check before first result

- **GIVEN** Tauri runtime, sync root configured, a leaf has sync status `synced`, and there is no `freshnessMap` entry for its document id
- **WHEN** no global freshness check batch is currently in progress for the knowledge base home freshness pipeline
- **THEN** the row shows a neutral pending affordance (e.g. clock icon) titled or labeled in spirit as **待检查远端版本**

#### Scenario: In-flight batch

- **GIVEN** the same leaf as above and a freshness check batch is in progress (automatic debounced pass, **全部刷新**, or **强制更新** metadata phase using the same API)
- **WHEN** the tree renders before the batch completes
- **THEN** the row shows a loading affordance (e.g. spinning icon) titled or labeled in spirit as **正在检查远端版本**

#### Scenario: Existing result unchanged

- **GIVEN** a `freshnessMap` entry exists for the document id
- **WHEN** the tree renders the freshness indicator
- **THEN** the system continues to show the existing `current` / `updated` / `new` / `error` presentation as today

### Requirement: Non-overlapping freshness check invocations

All client-side triggers that call the desktop `checkDocumentFreshness` batch command for the active sync root MUST serialize through a single queue so that at most one such batch runs at a time. This includes the debounced automatic check for all synced ids and the **全部刷新** / **强制更新** paths that refresh checked synced leaves.

#### Scenario: Debounce and manual refresh

- **WHEN** a debounced automatic freshness pass is about to start and the user simultaneously triggers **全部刷新**
- **THEN** the two operations MUST NOT invoke `checkDocumentFreshness` concurrently; one completes before the other starts

