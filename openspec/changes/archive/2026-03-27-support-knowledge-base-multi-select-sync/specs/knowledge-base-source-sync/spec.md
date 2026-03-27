## MODIFIED Requirements

### Requirement: Knowledge Base Scoped Discovery
The system MUST discover, present, and queue only documents that belong to the user-selected knowledge base sources. A selectable source MUST support an entire knowledge base, a directory subtree within that knowledge base, an individual document, or multiple explicitly selected document nodes from the same knowledge base.

#### Scenario: Ignore non-knowledge-base sources
- **WHEN** the source enumeration includes Feishu document containers outside selected knowledge base sources
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

#### Scenario: Build queue from multiple selected documents in one knowledge base
- **WHEN** the user explicitly selects multiple document nodes from the same knowledge base and starts synchronization
- **THEN** the system builds a sync queue containing exactly the deduplicated set of those selected documents

#### Scenario: Build queue from one-click parent document subtree selection
- **WHEN** the user triggers the one-click selection action for a parent document that has descendant documents inside the same knowledge base
- **THEN** the system adds that parent document and all descendant document nodes to the effective selected source set and builds a deduplicated sync queue from that expanded set

### Requirement: Incremental Synchronization Planning
The system MUST perform incremental synchronization using persisted sync state for the currently selected knowledge base sources, and MUST skip unchanged selected documents safely without re-queuing documents outside the current source set.

#### Scenario: Skip unchanged document in selected sources
- **WHEN** a document inside the current selected source set has remote version metadata that matches the local manifest state
- **THEN** the planner marks the document as no-op and does not re-fetch content

#### Scenario: Include changed document in selected sources
- **WHEN** a document inside the current selected source set has remote version metadata that differs from the local manifest state
- **THEN** the planner marks the document for re-fetch and output regeneration

#### Scenario: Exclude document outside selected sources
- **WHEN** a previously synced document exists in manifest state but is outside the source set selected for the current synchronization run
- **THEN** the planner does not queue that document for the current run

#### Scenario: Deduplicate duplicated document selections
- **WHEN** the current selected source set resolves to the same document more than once
- **THEN** the planner queues that document only once for the current run
