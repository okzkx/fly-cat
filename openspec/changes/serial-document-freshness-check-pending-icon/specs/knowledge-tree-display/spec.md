## ADDED Requirements

### Requirement: Freshness indicator shows pending and in-flight states

For **document** and **bitable** tree nodes whose sync status is `synced`, the freshness icon area MUST NOT be empty solely because a freshness result row is not yet loaded for that document id.

#### Scenario: Pending check before first result

- **GIVEN** Tauri runtime, sync root configured, a leaf has sync status `synced`, and there is no `freshnessMap` entry for its document id
- **WHEN** no global freshness check batch is currently in progress for the knowledge base home freshness pipeline
- **THEN** the row shows a neutral pending affordance (e.g. clock icon) titled or labeled in spirit as **待检查远端版本**

#### Scenario: In-flight batch

- **GIVEN** the same leaf as above and a freshness check batch is in progress (automatic debounced pass, **全部刷新**, or **强制更新** metadata phase using the same API)
- **WHEN** the tree renders before the batch completes
- **THEN** the row shows a loading affordance (e.g. spinning icon) titled or labeled in spirit as **正在检查远端版本**

#### Scenario: Existing result unchanged

- **GIVEN** a `freshnessMap` entry exists for the document id
- **WHEN** the tree renders the freshness indicator
- **THEN** the system continues to show the existing `current` / `updated` / `new` / `error` presentation as today

### Requirement: Non-overlapping freshness check invocations

All client-side triggers that call the desktop `checkDocumentFreshness` batch command for the active sync root MUST serialize through a single queue so that at most one such batch runs at a time. This includes the debounced automatic check for all synced ids and the **全部刷新** / **强制更新** paths that refresh checked synced leaves.

#### Scenario: Debounce and manual refresh

- **WHEN** a debounced automatic freshness pass is about to start and the user simultaneously triggers **全部刷新**
- **THEN** the two operations MUST NOT invoke `checkDocumentFreshness` concurrently; one completes before the other starts
