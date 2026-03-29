# knowledge-tree-display

## MODIFIED Requirements

### Requirement: Display sync status tag on document nodes

The knowledge base tree SHALL display a sync status tag next to each document node's title. The tag content and color depend on the document's current sync state:

- **Synced** (green tag, `success`): "已同步 MM-DD HH:mm" using the `lastSyncedAt` timestamp formatted as local month-day hour:minute
- **Failed** (red tag, `error`): "同步失败"
- **Syncing** (blue tag, `processing`): "同步中 X/Y" where X is `counters.processed` and Y is `counters.total` from the active task
- **Not synced** (gray tag, `default`): "未同步"

Folder, space, and bitable nodes SHALL NOT display a sync status tag. In browser mode (non-Tauri runtime), no sync status tags SHALL be displayed.

#### Scenario: Synced document in tree
- **GIVEN** the document status map contains documentId "doc-1" with status "synced" and lastSyncedAt "2026-03-28T14:30:00+08:00"
- **WHEN** the tree renders the node for "doc-1"
- **THEN** a green tag with text "已同步 03-28 14:30" SHALL appear next to the document title

#### Scenario: Failed document in tree
- **GIVEN** the document status map contains documentId "doc-2" with status "failed"
- **WHEN** the tree renders the node for "doc-2"
- **THEN** a red tag with text "同步失败" SHALL appear next to the document title

#### Scenario: Document currently being synced
- **GIVEN** there is an active syncing task with counters { processed: 3, total: 10 } and the document is in the task's selectedSources
- **WHEN** the tree renders the node for that document
- **THEN** a blue tag with text "同步中 3/10" SHALL appear next to the document title

#### Scenario: Document never synced
- **GIVEN** the document is NOT in the document status map and NOT in any active task's selectedSources
- **WHEN** the tree renders the node for that document
- **THEN** a gray tag with text "未同步" SHALL appear next to the document title

#### Scenario: Folder node in tree
- **WHEN** the tree renders a folder type node
- **THEN** no sync status tag SHALL be displayed

#### Scenario: Browser mode rendering
- **GIVEN** the application is running in browser mode
- **WHEN** the tree renders any document node
- **THEN** no sync status tag SHALL be displayed
