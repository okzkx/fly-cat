## ADDED Requirements

### Requirement: Batch Document Freshness Query
The system MUST provide a Tauri command that accepts a list of document IDs and a sync root path, fetches each document's latest version and update time from the Feishu API, compares against the local sync manifest, and returns per-document freshness status. The command MUST be asynchronous so the UI thread remains responsive during API calls.

#### Scenario: Document is current
- **WHEN** a document ID in the request list has a successful manifest record whose `version` and `update_time` both match the latest values returned by the Feishu API
- **THEN** the result for that document has status `"current"`

#### Scenario: Document has remote update
- **WHEN** a document ID in the request list has a successful manifest record but either `version` or `update_time` differs from the latest values returned by the Feishu API
- **THEN** the result for that document has status `"updated"` and includes both the local and remote version and update time values

#### Scenario: Document is new to manifest
- **WHEN** a document ID in the request list does not have any manifest record in the sync root
- **THEN** the result for that document has status `"new"`

#### Scenario: API failure for individual document
- **WHEN** fetching the latest metadata for a document ID fails due to network error, permission error, or invalid response
- **THEN** the result for that document has status `"error"` and includes an error message, and processing continues for remaining documents

#### Scenario: Empty document list returns empty result
- **WHEN** the command is called with an empty document ID list
- **THEN** the command returns an empty map without making any API calls

### Requirement: Freshness Result Includes Version Context
Each freshness result MUST include the local and remote `version` and `update_time` values so the frontend can display meaningful comparison information.

#### Scenario: Result contains version details
- **WHEN** the freshness check returns a result for a document
- **THEN** the result includes `localVersion`, `remoteVersion`, `localUpdateTime`, and `remoteUpdateTime` fields
