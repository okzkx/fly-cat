# Sync Pipeline

## ADDED Requirements

### Requirement: Export Task API for document content fetching

The sync pipeline SHALL use the Feishu Export Task API (`/drive/v1/export_tasks`) as the primary method for fetching document content.

#### Scenario: Export a wiki document via Export Task API

- Given a wiki document with obj_type "doc"
- When the sync pipeline fetches the document
- Then it SHALL create an export task with file_extension "docx"
- And it SHALL poll the task status until job_status equals 0
- And it SHALL download the exported file and save it to disk
- And the output file SHALL have the correct extension (.docx)

#### Scenario: Export a sheet document

- Given a document with obj_type "sheet"
- When the sync pipeline fetches the document
- Then it SHALL create an export task with file_extension "xlsx"
- And the output file SHALL have extension ".xlsx"

#### Scenario: Fallback to raw_content on Export Task failure

- Given a document where Export Task API returns an error
- When the error is not a permanent permission error
- Then the pipeline SHALL fallback to the existing raw_content API
- And the document SHALL be saved as markdown (.md)

## MODIFIED Requirements

### Requirement: Increased concurrency for parallel processing

The sync pipeline SHALL process documents with a concurrency of 8 instead of 4.

#### Scenario: Process documents with concurrency 8

- Given a sync task with 20 documents
- When the sync pipeline processes documents in parallel
- Then documents SHALL be processed in batches of 8
- And the overall throughput SHALL be approximately 2x higher than with concurrency 4

### Requirement: HTTP connection reuse via shared Agent

The FeishuOpenApiClient SHALL reuse HTTP connections across requests by using a shared ureq::Agent.

#### Scenario: Multiple requests reuse connections

- Given a FeishuOpenApiClient instance
- When multiple API requests are made through the client
- Then the client SHALL use a single ureq::Agent for all requests
- And HTTP connections SHALL be reused when possible
