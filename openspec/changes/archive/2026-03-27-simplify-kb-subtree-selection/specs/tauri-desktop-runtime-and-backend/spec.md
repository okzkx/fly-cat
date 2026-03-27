## ADDED Requirements

### Requirement: Desktop Subtree Selection Regression Automation
The repository MUST provide a tauri-driver based desktop automation workflow that validates document subtree selection behavior against a deterministic Tauri runtime fixture.

#### Scenario: Automated desktop validation uses fixture runtime
- **WHEN** a developer runs the subtree-selection desktop regression workflow
- **THEN** the workflow launches the Tauri desktop application through tauri-driver with deterministic fixture data for knowledge base spaces, source trees, and task history instead of depending on the developer's real Feishu account state

#### Scenario: Automated desktop validation covers subtree interactions
- **WHEN** the desktop regression workflow executes
- **THEN** it verifies at least leaf-document selection, parent-document subtree coverage, descendant checkbox disablement, same-knowledge-base multi-root selection, and cross-knowledge-base switching behavior in the real desktop runtime

#### Scenario: Automated desktop validation covers task summaries
- **WHEN** the desktop regression workflow opens the task list
- **THEN** it verifies subtree-aware source-summary rendering and effective document-count presentation for seeded subtree tasks
