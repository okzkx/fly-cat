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

