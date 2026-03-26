## ADDED Requirements

### Requirement: Knowledge Base Scoped Discovery
The system MUST discover and queue only documents that belong to Feishu knowledge base spaces selected by the user.

#### Scenario: Ignore non-knowledge-base sources
- **WHEN** the source enumeration includes Feishu document containers outside selected knowledge base spaces
- **THEN** the sync planner excludes those items from the sync queue

#### Scenario: Build queue from selected spaces
- **WHEN** the user selects one or more knowledge base spaces and starts synchronization
- **THEN** the system builds a sync queue containing only documents from those spaces

### Requirement: Incremental Synchronization Planning
The system MUST perform incremental synchronization using persisted sync state, and MUST skip unchanged documents safely.

#### Scenario: Skip unchanged document
- **WHEN** a document's remote version metadata matches the local manifest state
- **THEN** the planner marks the document as no-op and does not re-fetch content

#### Scenario: Include changed document
- **WHEN** a document's remote version metadata differs from the local manifest state
- **THEN** the planner marks the document for re-fetch and output regeneration

### Requirement: Persistent Sync Manifest
The system MUST persist per-document sync metadata sufficient for retry, audit, and subsequent incremental runs.

#### Scenario: Record successful sync entry
- **WHEN** a document sync completes successfully
- **THEN** the manifest stores document identifier, source version metadata, output path, and last successful sync timestamp

#### Scenario: Record failed sync entry
- **WHEN** a document sync fails
- **THEN** the manifest stores failure status and error classification without deleting prior successful metadata for other documents
