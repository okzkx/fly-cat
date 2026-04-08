## ADDED Requirements

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
