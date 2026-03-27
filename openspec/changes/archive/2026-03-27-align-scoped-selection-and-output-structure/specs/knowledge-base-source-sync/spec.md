## MODIFIED Requirements

### Requirement: Knowledge Base Scoped Discovery
The system MUST discover, present, and queue only documents that belong to user-selected knowledge base scopes. A selectable scope MUST support an entire knowledge base, a directory subtree within that knowledge base, or an individual document.

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

### Requirement: Incremental Synchronization Planning
The system MUST perform incremental synchronization using persisted sync state for the currently selected scopes, and MUST skip unchanged in-scope documents safely without re-queuing out-of-scope documents.

#### Scenario: Skip unchanged document in selected scope
- **WHEN** a document inside the selected scope has remote version metadata that matches the local manifest state
- **THEN** the planner marks the document as no-op and does not re-fetch content

#### Scenario: Include changed document in selected scope
- **WHEN** a document inside the selected scope has remote version metadata that differs from the local manifest state
- **THEN** the planner marks the document for re-fetch and output regeneration

#### Scenario: Exclude document outside selected scope
- **WHEN** a previously synced document exists in manifest state but is outside the scope selected for the current synchronization run
- **THEN** the planner does not queue that document for the current run

### Requirement: Persistent Sync Manifest
The system MUST persist per-document sync metadata sufficient for retry, audit, scoped planning, and subsequent incremental runs.

#### Scenario: Record successful sync entry
- **WHEN** a document sync completes successfully
- **THEN** the manifest stores document identifier, selected scope context, source-relative path metadata, output path, and last successful sync timestamp

#### Scenario: Record failed sync entry
- **WHEN** a document sync fails
- **THEN** the manifest stores failure status and error classification without deleting prior successful metadata for other documents
