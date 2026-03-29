# knowledge-base-source-sync Specification

## Purpose
TBD - created by archiving change create-feishu-knowledge-base-sync-app. Update Purpose after archive.
## Requirements
### Requirement: Knowledge Base Scoped Discovery
The system MUST discover, classify, present, and queue only documents that belong to user-selected knowledge base sources. A selectable source MUST support an entire knowledge base, a directory subtree within that knowledge base, or one or more selected subtree roots from the same knowledge base where each root can be either a directory node or a document node. Selecting a directory source MUST implicitly include every descendant document under that directory. Selecting a document source that has descendant documents MUST implicitly include that document and all descendant documents in the effective sync set. Selecting an entire knowledge base (space) MUST be presented as a checkable option in the source tree and MUST include all descendant documents within that space when discovery runs. Source discovery used for scoped selection MUST return only the immediate children of the expanded knowledge base or parent node for each expansion step, MUST classify non-directory items such as Feishu Bitable as leaf nodes rather than directories, MUST classify knowledge-base library/container nodes that represent grouped documents as directory nodes, and MUST NOT issue additional remote discovery requests when a user only changes local checkbox selection state. The system MUST emit a progress event to the frontend after each individual document completes synchronization, and MUST report the total document count so the frontend can display "已处理 X / 共 Y" alongside existing success/skip/failure counters.

#### Scenario: Ignore non-knowledge-base sources
- **WHEN** the source enumeration includes Feishu document containers outside selected knowledge base sources
- **THEN** the sync planner excludes those items from the sync queue

#### Scenario: Build queue from selected knowledge base
- **WHEN** the user selects an entire knowledge base by checking the space node and starts synchronization
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

#### Scenario: Space node checkbox is enabled
- **WHEN** the knowledge base source tree renders a space node representing an entire knowledge base
- **THEN** the space node presents an enabled checkbox that the user can check or uncheck

#### Scenario: Selecting a space node sets the selection scope
- **WHEN** the user checks the checkbox on a space node in the knowledge base source tree
- **THEN** the system adds the space as a selected sync source and clears any previously selected child sources within that space

#### Scenario: Space-level validation accepts space kind
- **WHEN** the user submits a sync request with a space-level selected source where kind is "space"
- **THEN** the backend validates the source without rejecting it based on the kind field

#### Scenario: Space discovery finds all documents via root listing
- **WHEN** a space-level scope is used for document discovery and the scope has no node_token
- **THEN** the system lists child nodes from the space root and recursively collects all descendant documents

#### Scenario: Progress event emitted per document
- **WHEN** a single document in the sync queue finishes processing (success or failure)
- **THEN** the backend emits one sync-progress event with updated counters reflecting that single document's completion

#### Scenario: Total document count reported in counters
- **WHEN** the sync task starts and document discovery completes
- **THEN** the counters.total field reflects the total number of documents to synchronize and the frontend displays "已处理 X / 共 Y" where Y equals counters.total

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

#### Scenario: Deduplicate overlapping selected roots
- **WHEN** the current selected source set resolves to the same document more than once because a selected directory, selected parent document subtree, or legacy descendant selection overlaps another selected root
- **THEN** the planner queues that document only once for the current run

### Requirement: Persistent Sync Manifest
The system MUST persist per-document sync metadata sufficient for retry, audit, scoped planning, and subsequent incremental runs.

#### Scenario: Record successful sync entry
- **WHEN** a document sync completes successfully
- **THEN** the manifest stores document identifier, selected scope context, source-relative path metadata, output path, and last successful sync timestamp

#### Scenario: Record failed sync entry
- **WHEN** a document sync fails
- **THEN** the manifest stores failure status and error classification without deleting prior successful metadata for other documents

### Requirement: Knowledge Space Discovery Uses Authoritative Access Check
The system MUST determine Feishu knowledge space accessibility using the same effective backend access path as space discovery or synchronization planning, and MUST NOT reject a configuration solely because a narrower preflight check failed first.

#### Scenario: Valid configuration is not blocked by false-negative preflight
- **WHEN** an initial connection validation probe fails but the configured Feishu/MCP integration can successfully enumerate accessible knowledge spaces through the authoritative discovery path
- **THEN** the system reports the connection as usable and returns the discovered knowledge spaces

#### Scenario: Discovery path determines final failure
- **WHEN** connection validation starts and the authoritative knowledge space discovery path fails due to transport, authentication, or permission errors
- **THEN** the system classifies the connection as failed using the authoritative discovery error rather than a generic preflight failure

### Requirement: Knowledge Space Discovery Classifies Empty And Error Outcomes
The system MUST distinguish an authoritative empty result from an error result when loading knowledge spaces.

#### Scenario: No joined knowledge spaces
- **WHEN** authoritative discovery completes successfully and returns zero accessible knowledge spaces
- **THEN** the system classifies the result as `connected-no-spaces` rather than a connection failure

#### Scenario: Permission denied during space discovery
- **WHEN** authoritative discovery fails because the app lacks required wiki read access or equivalent knowledge base access permission
- **THEN** the system classifies the result as `permission-denied` and includes a diagnostic that indicates missing knowledge base access rather than returning an empty list

#### Scenario: Unexpected response shape during discovery
- **WHEN** the discovery response is received but does not contain the fields required to determine knowledge space accessibility
- **THEN** the system classifies the result as `unexpected-response` and does not present the result as a normal empty space list

### Requirement: User-Authorized Knowledge Base Access
The system MUST perform knowledge base discovery, document enumeration, and synchronization using the currently signed-in user's effective Feishu permissions rather than application-only credentials.

#### Scenario: Signed-in user discovers accessible spaces
- **WHEN** Feishu application settings are valid and a user has signed in successfully
- **THEN** the system loads only knowledge base spaces that are accessible to that signed-in user

#### Scenario: Signed-out state blocks discovery
- **WHEN** no valid signed-in user session is present
- **THEN** the system does not treat saved application configuration alone as sufficient to enumerate knowledge bases or start synchronization

### Requirement: Sync Authorization Must Stay Consistent
The system MUST use the same user authorization context for synchronization execution that was used for pre-sync discovery and source selection.

#### Scenario: Sync start requires a valid user session
- **WHEN** a user starts a synchronization task after selecting knowledge base spaces
- **THEN** the backend starts the task only if the current signed-in user session is still valid for knowledge base access

#### Scenario: Session expiry during sync does not fall back to app-only access
- **WHEN** the signed-in user's session expires or is revoked while a synchronization task is running
- **THEN** the task stops or becomes partially failed with an authorization-specific error instead of silently falling back to application-only credentials

### Requirement: Per-Document Sync Progress Display
The frontend MUST display the total document count alongside per-document progress in the task list. The "统计" column SHALL show "已处理 X / 共 Y" above the existing success/skip/failure counters, where X is counters.processed and Y is counters.total.

#### Scenario: Syncing task shows total count
- **WHEN** a sync task is in "syncing" state with counters.processed = 3 and counters.total = 20
- **THEN** the UI displays "已处理 3 / 共 20" above the success/skip/failure line

#### Scenario: Completed task shows total count
- **WHEN** a sync task is in "completed" state with counters.processed = 20 and counters.total = 20
- **THEN** the UI displays "已处理 20 / 共 20" above the success/skip/failure line

#### Scenario: Discovering task shows total as not yet known
- **WHEN** a sync task is in "discovering" lifecycle state
- **THEN** the UI shows "正在发现文档..." without a total count, preserving existing behavior

