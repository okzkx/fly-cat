## ADDED Requirements

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
