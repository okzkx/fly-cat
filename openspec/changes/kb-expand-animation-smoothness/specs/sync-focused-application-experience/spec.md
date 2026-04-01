## ADDED Requirements

### Requirement: Source tree expand and collapse visual smoothness

The application SHALL keep expand and collapse transitions for the source-selection knowledge tree visually smooth when asynchronous child loading completes, without changing one-level expansion semantics, lazy-load ordering, checkbox tri-state behavior, or selection highlighting rules.

#### Scenario: Root “知识库” node toggled repeatedly

- **WHEN** a user expands and collapses the root knowledge tree node multiple times
- **THEN** the expand and collapse transitions remain visually continuous and the tree does not skip levels or show deeper descendants until the user expands the corresponding parent nodes

#### Scenario: Space node children arrive after expand

- **WHEN** a user expands a knowledge space node and the client finishes loading that space’s direct children
- **THEN** the UI still presents only the immediate child level for that expansion and the transition is not visibly disrupted by a large synchronous UI update competing with the motion
