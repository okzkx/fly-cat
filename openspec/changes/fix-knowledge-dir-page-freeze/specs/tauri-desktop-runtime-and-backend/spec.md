## MODIFIED Requirements

### Requirement: Non-Blocking Tree and Task Commands
The application MUST execute tree-loading and sync-task-creation Tauri commands asynchronously so the UI thread remains responsive during Feishu API calls. The `get_app_bootstrap` command MUST also execute asynchronously so that bootstrap-time network calls do not block the UI thread.

#### Scenario: Expanding tree nodes does not freeze the UI
- **WHEN** a user expands a knowledge base node or document node in the source-selection tree
- **THEN** the HTTP calls to list child nodes run on a background thread and the window remains responsive

#### Scenario: Creating a sync task does not freeze the UI
- **WHEN** a user creates a sync task that requires discovering documents from multiple knowledge base nodes
- **THEN** the document discovery HTTP calls run on a background thread and the window remains responsive

#### Scenario: App bootstrap does not freeze the UI
- **WHEN** the frontend calls `get_app_bootstrap` (at application start, after settings save, or after authorization)
- **THEN** the bootstrap command executes its network calls on a background thread and the window remains responsive
