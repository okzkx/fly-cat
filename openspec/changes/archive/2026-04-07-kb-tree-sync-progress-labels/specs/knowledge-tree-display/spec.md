## MODIFIED Requirements

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
