# tree-document-disable

## MODIFIED Requirements

### Requirement: Disable Checkboxes for Already-Downloaded Documents
The knowledge base tree SHALL prevent users from selecting documents that have already been successfully synced. The backend provides a `get_synced_document_ids` command that returns the set of document IDs recorded in the sync manifest. The frontend loads this set on app bootstrap and passes it to the tree component. Tree nodes whose `documentId` matches an entry in the set SHALL have `disableCheckbox: true`.

#### Scenario: User opens knowledge base tree with previously synced documents
- **WHEN** the sync manifest contains a successfully synced document with document_id "doc-abc"
- **THEN** the tree node for "doc-abc" SHALL have its checkbox disabled

#### Scenario: User opens knowledge base tree in browser mode with no manifest
- **WHEN** the application is running in browser mode
- **THEN** no documents SHALL have their checkboxes disabled due to download status
