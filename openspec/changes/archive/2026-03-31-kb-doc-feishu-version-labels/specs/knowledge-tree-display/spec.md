## ADDED Requirements

### Requirement: Document and bitable nodes show local and remote Feishu revision labels

When the app runs in Tauri with a configured sync root and document sync statuses are loaded, each **document** and **bitable** tree node SHALL display secondary text immediately after the node title (same title row) in the form `本地 <local> / 远端 <remote>`, where `<local>` and `<remote>` are Feishu revision identifiers or an em dash `—` when unknown.

- **Local** SHALL be the manifest revision for that document when present in sync statuses; otherwise `—`.
- **Remote** SHALL prefer the persisted freshness check remote revision for that document when non-empty; otherwise SHALL use the wiki child-node list revision carried on the tree node when non-empty; otherwise `—`.

In browser (non-Tauri) runtime or when sync statuses are empty, the system SHALL NOT render this revision line.

#### Scenario: Synced document with manifest and freshness

- **GIVEN** Tauri runtime, sync root configured, document `doc-1` has sync status with local Feishu revision `rev-a` and freshness metadata with remote revision `rev-b`
- **WHEN** the tree renders the document node for `doc-1`
- **THEN** it shows secondary text `本地 rev-a / 远端 rev-b` after the title

#### Scenario: Never-synced document with list revision only

- **GIVEN** Tauri runtime, sync root configured, document `doc-2` has no manifest status entry, tree node carries wiki list revision `rev-list`, and no freshness row for `doc-2`
- **WHEN** the tree renders the document node for `doc-2`
- **THEN** it shows secondary text `本地 — / 远端 rev-list`

#### Scenario: Browser mode

- **GIVEN** browser runtime (no Tauri)
- **WHEN** the tree renders any document node
- **THEN** no local/remote revision line is shown
