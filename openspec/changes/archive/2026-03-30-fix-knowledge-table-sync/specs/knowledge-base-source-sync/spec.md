## MODIFIED Requirements

### Requirement: Knowledge Base Scoped Discovery

The system MUST discover, classify, present, and queue only syncable items that belong to user-selected knowledge base sources. A selectable source MUST support an entire knowledge base, a directory subtree within that knowledge base, or one or more selected subtree roots from the same knowledge base where each root can be either a directory node, a document node, or a bitable leaf node. Selecting a directory source MUST implicitly include every descendant syncable leaf under that directory. Selecting a document source that has descendant documents MUST implicitly include that document and all descendant syncable leaves in the effective sync set. Selecting an entire knowledge base (space) MUST be presented as a checkable option in the source tree and MUST include all descendant syncable leaves within that space when discovery runs. Source discovery used for scoped selection MUST return only the immediate children of the expanded knowledge base or parent node for each expansion step, MUST classify non-directory items such as Feishu Bitable as leaf nodes rather than directories, and MUST NOT issue additional remote discovery requests when a user only changes local checkbox selection state. The system MUST emit a progress event to the frontend after each individual syncable leaf completes synchronization, and MUST report the total document count so the frontend can display "已处理 X / 共 Y" alongside existing success/skip/failure counters. The system MUST include the list of all discovered document IDs in the `SyncTask` so the frontend can identify discovered-but-not-yet-synced items. The system MUST persist the sync manifest to disk after every individual syncable leaf completes, so that subsequent status queries reflect per-item progress immediately. Before creating a new sync task, the system MUST delete any items that are currently synced on disk but are not included in the current checked keys set, by calling `removeSyncedDocuments` with the corresponding document IDs.

#### Scenario: Build queue from selected bitable leaf
- **WHEN** the user selects a bitable leaf inside a knowledge base and starts synchronization
- **THEN** the system builds a sync queue containing that table item only
- **AND** the queued item preserves its table `obj_type` so the export path can produce an `.xlsx` file

#### Scenario: Build queue from selected directory subtree with descendant bitable
- **WHEN** the user selects a directory or whole knowledge base that contains descendant bitable leaves and starts synchronization
- **THEN** the system includes those descendant bitable leaves in the effective sync queue together with descendant documents

#### Scenario: Bitable leaf is selectable as a sync source
- **WHEN** the discovery result contains a Feishu Bitable item
- **THEN** the system classifies that item as a non-directory leaf node with an enabled selectable sync scope instead of an unsupported source

### Requirement: Incremental Synchronization Planning

The system MUST perform incremental synchronization using persisted sync state for the currently selected knowledge base sources, and MUST skip unchanged selected syncable leaves safely without re-queuing items outside the current source set.

#### Scenario: Skip unchanged exported bitable in selected sources
- **WHEN** a previously synchronized bitable leaf inside the current selected source set still has matching remote version metadata and the expected `.xlsx` output path
- **THEN** the planner marks that item as no-op and does not re-queue it for download
