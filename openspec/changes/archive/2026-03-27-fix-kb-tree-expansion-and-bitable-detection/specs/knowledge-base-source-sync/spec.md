## MODIFIED Requirements

### Requirement: Knowledge Base Scoped Discovery
The system MUST discover, classify, present, and queue only documents that belong to user-selected knowledge base scopes. A selectable scope MUST support an entire knowledge base, a directory subtree within that knowledge base, or an individual document. Source discovery used for scoped selection MUST return only the immediate children of the expanded knowledge base or parent node for each expansion step, and MUST classify non-directory items such as Feishu Bitable as leaf nodes rather than directories.

#### Scenario: Ignore non-knowledge-base sources
- **WHEN** the source enumeration includes Feishu document containers outside selected knowledge base scopes
- **THEN** the sync planner excludes those items from the sync queue

#### Scenario: Build queue from selected knowledge base
- **WHEN** the user selects an entire knowledge base and starts synchronization
- **THEN** the system builds a sync queue containing all documents that belong to that knowledge base

#### Scenario: Build queue from selected directory subtree
- **WHEN** the user selects a directory inside a knowledge base and starts synchronization
- **THEN** the system builds a sync queue containing documents in that directory and its descendant directories only

#### Scenario: Build queue from selected individual document
- **WHEN** the user selects a single document inside a knowledge base and starts synchronization
- **THEN** the system builds a sync queue containing only that document

#### Scenario: Expanding a knowledge base returns only direct children
- **WHEN** the user expands a knowledge base in the scoped source browser
- **THEN** the discovery result contains only that knowledge base's immediate child nodes and excludes deeper descendants until their direct parent is expanded

#### Scenario: Expanding a parent node returns only direct children
- **WHEN** the user expands a directory or parent document that has child documents
- **THEN** the discovery result contains only that parent node's immediate child nodes and excludes grandchildren until those immediate children are expanded

#### Scenario: Bitable is classified as a leaf node
- **WHEN** the discovery result contains a Feishu Bitable item
- **THEN** the system classifies that item as a non-directory leaf node and does not represent it as a directory in scoped source data
