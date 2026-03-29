## ADDED Requirements

### Requirement: Freshness metadata persistence

The system SHALL store document freshness check results in a SQLite database for later retrieval.

#### Scenario: Save freshness metadata
- **WHEN** `save_freshness_metadata` is called with document IDs and their freshness results
- **THEN** the system stores each document's freshness status in the `freshness_metadata` table

#### Scenario: Load freshness metadata
- **WHEN** `load_freshness_metadata` is called
- **THEN** the system returns all stored freshness records as a HashMap

#### Scenario: Clear freshness metadata
- **WHEN** `clear_freshness_metadata` is called with document IDs
- **THEN** the system removes those records from the database

### Requirement: Freshness status display

The system SHALL display freshness status indicators next to synced documents in the knowledge base tree.

#### Scenario: Display current status
- **WHEN** a document is synced and its freshness status is "current"
- **THEN** a green checkmark icon is displayed next to the document

#### Scenario: Display updated status
- **WHEN** a document is synced and its freshness status is "updated"
- **THEN** a yellow warning icon is displayed with a tooltip showing the remote version

#### Scenario: Display new status
- **WHEN** a document is synced and its freshness status is "new"
- **THEN** a blue sync icon is displayed indicating the document exists remotely

#### Scenario: Display error status
- **WHEN** a document freshness check fails
- **THEN** a red error icon is displayed with a tooltip showing the error message

### Requirement: Automatic freshness check

The system SHALL automatically check freshness for synced documents when the page loads.

#### Scenario: Check on page load
- **WHEN** the knowledge base page loads with synced documents
- **THEN** the system debounces for 2 seconds and then checks freshness for all synced documents

#### Scenario: Persist check results
- **WHEN** freshness check completes
- **THEN** the results are saved to the SQLite database
