## ADDED Requirements

### Requirement: Metadata display on non-document tree nodes
The system SHALL display sync metadata status tags on ALL tree node types (space, folder, document, bitable), not only document nodes.

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
- **THEN** it shows a tag "不支持" in a neutral style

#### Scenario: Bitable node with active sync on sibling documents
- **WHEN** a sync is in progress that includes sibling documents of a bitable node
- **THEN** the bitable node still shows "不支持" without progress information
