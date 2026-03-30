## MODIFIED Requirements

### Requirement: Metadata display on non-document tree nodes

The system SHALL display sync metadata status tags on ALL tree node types (space, folder, document, bitable), not only document nodes. Space and folder nodes MUST continue to show aggregate status, while document and bitable leaf nodes MUST show their own per-item sync state. When a sync task is active and items have been discovered, individual leaf nodes that are in the discovered set but have no manifest status entry yet MUST display "等待同步" to distinguish them from leaves outside the current sync scope.

#### Scenario: Bitable node without sync records
- **WHEN** a bitable node is rendered in the knowledge tree and it has no synced status entry
- **THEN** it shows a neutral "未同步" tag instead of an unsupported tag

#### Scenario: Bitable node discovered but not yet synced
- **WHEN** a sync task is active with discovery completed and a bitable node is in the discovered set but has no manifest status entry yet
- **THEN** the bitable node shows a tag "等待同步" in a neutral style

#### Scenario: Bitable node transitions to synced
- **WHEN** a previously discovered bitable node completes synchronization successfully
- **THEN** the bitable node shows a success tag "已同步" with the sync timestamp

#### Scenario: Bitable node transitions to failed
- **WHEN** a previously discovered bitable node fails during synchronization
- **THEN** the bitable node shows a tag "同步失败" in an error style
