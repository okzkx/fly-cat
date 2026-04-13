## ADDED Requirements

### Requirement: Remote-missing manifest leaves in the knowledge tree

The system SHALL surface successful manifest records that still have on-disk outputs but whose `document_id` does not appear in the remote wiki child listing for the same parent folder (including the space root) as additional document or bitable leaves merged into that tree level.

#### Scenario: Leaf appears when remote omits it

- **GIVEN** a configured sync root whose manifest contains a successful `docx` record with a local output file, matching `space_id`, and `path_segments` placing it as a direct child of folder `F`
- **WHEN** the remote wiki API returns children for `F` without that `document_id`
- **THEN** the loaded tree children for `F` include a leaf for that record with `localOnlyNotOnRemote` true and a title that still identifies the document to the user

#### Scenario: No duplicate when remote still lists the document

- **GIVEN** the same manifest record exists and the remote child list still returns a node with the same `document_id`
- **WHEN** the tree loads for that parent
- **THEN** the UI shows only the remote node and does not add a second synthetic leaf for the same `document_id`

### Requirement: Selection and sync cleanup for remote-missing leaves

The system SHALL allow users to include remote-missing manifest leaves in the sync selection. When a sync task runs with such a leaf in scope, the backend SHALL remove the local exported outputs and manifest rows for that document without attempting a Feishu content download for that entry.

#### Scenario: User cleans up a remote-missing document via sync

- **GIVEN** a remote-missing manifest leaf is visible and the user checks it (or a covering folder selection that includes it) and starts a sync task
- **WHEN** the task finishes successfully for that entry
- **THEN** the local output file is removed, the manifest row is removed, and subsequent tree loads no longer show that leaf
