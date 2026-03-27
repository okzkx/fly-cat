## MODIFIED Requirements

### Requirement: Knowledge Base Scoped Discovery
The system MUST discover, classify, present, and queue only documents that belong to user-selected knowledge base sources. A selectable source MUST support an entire knowledge base, a directory subtree within that knowledge base, or one or more selected subtree roots from the same knowledge base where each root can be either a directory node or a document node. Selecting a directory source MUST implicitly include every descendant document under that directory. Selecting a document source that has descendant documents MUST implicitly include that document and all descendant documents in the effective sync set. Source discovery used for scoped selection MUST return only the immediate children of the expanded knowledge base or parent node for each expansion step, MUST classify non-directory items such as Feishu Bitable as leaf nodes rather than directories, MUST classify knowledge-base library/container nodes that represent grouped documents as directory nodes, and MUST NOT issue additional remote discovery requests when a user only changes local checkbox selection state.

#### Scenario: Ignore non-knowledge-base sources
- **WHEN** the source enumeration includes Feishu document containers outside selected knowledge base sources
- **THEN** the sync planner excludes those items from the sync queue

#### Scenario: Build queue from selected knowledge base
- **WHEN** the user selects an entire knowledge base and starts synchronization
- **THEN** the system builds a sync queue containing all documents that belong to that knowledge base

#### Scenario: Build queue from selected directory subtree
- **WHEN** the user selects a directory inside a knowledge base and starts synchronization
- **THEN** the system builds a sync queue containing documents in that directory and its descendant directories only

#### Scenario: Build queue from selected leaf document
- **WHEN** the user selects a document inside a knowledge base that has no descendant documents and starts synchronization
- **THEN** the system builds a sync queue containing only that document

#### Scenario: Build queue from selected document subtree
- **WHEN** the user selects a document inside a knowledge base that has descendant documents and starts synchronization
- **THEN** the system builds a sync queue containing that document and every descendant document in its subtree

#### Scenario: Build queue from multiple selected directory and document roots in one knowledge base
- **WHEN** the user selects multiple directory or document roots from the same knowledge base and starts synchronization
- **THEN** the system builds a sync queue containing the deduplicated union of every document covered by those selected roots

#### Scenario: Expanding a knowledge base returns only direct children
- **WHEN** the user expands a knowledge base in the scoped source browser
- **THEN** the discovery result contains only that knowledge base's immediate child nodes and excludes deeper descendants until their direct parent is expanded

#### Scenario: Expanding a parent node returns only direct children
- **WHEN** the user expands a directory or parent document that has child documents
- **THEN** the discovery result contains only that parent node's immediate child nodes and excludes grandchildren until those immediate children are expanded

#### Scenario: Library node is selectable as a directory source
- **WHEN** the discovery result contains a knowledge-base library/container node that groups descendant documents within the same space
- **THEN** the system classifies that node as a directory source with a selectable sync scope instead of as an unsupported leaf node

#### Scenario: Checkbox selection does not trigger remote discovery
- **WHEN** the user checks or unchecks a directory or document node that already exists in the current tree state
- **THEN** the system updates the selected source set without issuing extra remote discovery requests for that node's descendants

#### Scenario: Bitable is classified as a leaf node
- **WHEN** the discovery result contains a Feishu Bitable item
- **THEN** the system classifies that item as a non-directory leaf node and does not represent it as a directory in scoped source data
