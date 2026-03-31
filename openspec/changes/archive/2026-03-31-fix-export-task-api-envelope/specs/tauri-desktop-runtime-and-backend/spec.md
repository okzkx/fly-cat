## ADDED Requirements

### Requirement: Feishu Drive export_task OpenAPI envelope parsing

The backend Feishu OpenAPI client MUST parse successful create and query responses for `/drive/v1/export_tasks` using the standard Feishu Open Platform JSON envelope (`code`, `msg`, `data`). It MUST read the export task ticket from `data.ticket` when creating a task, and MUST read task status fields (including `job_status` and `file_token`) from `data.result` when polling. It SHOULD accept a root-level `ticket` or `result` only as a backward-compatible fallback for tests or atypical gateways.

#### Scenario: Create export task reads ticket from data

- **WHEN** the client handles a successful `POST /drive/v1/export_tasks` response whose body matches the documented shape (`code` is 0 and `data.ticket` is present)
- **THEN** the client extracts the ticket string from `data.ticket` and proceeds to poll export status

#### Scenario: Query export task reads result from data

- **WHEN** the client handles a successful `GET /drive/v1/export_tasks/{ticket}` response whose body matches the documented shape (`code` is 0 and `data.result` is present)
- **THEN** the client reads `job_status` and related fields from `data.result` to decide whether the export finished, failed, or should be polled again

#### Scenario: Non-zero OpenAPI code on create does not masquerade as missing ticket

- **WHEN** the create export task response has a non-zero `code` and an error `msg`
- **THEN** the client surfaces that API error and does not report `export_tasks missing ticket` solely because `ticket` is absent
