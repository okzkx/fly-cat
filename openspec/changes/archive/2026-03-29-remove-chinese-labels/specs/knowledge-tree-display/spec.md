## ADDED Requirements

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
