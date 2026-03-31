## ADDED Requirements

### Requirement: Tri-state respects scope-only keys for covered descendants

When a node's `SyncScope` covers descendants (`space`, `folder`, or `document` with `includesDescendants`), the knowledge base tree MAY represent selection using only that node's key in the merged checked-key set (without listing every descendant key). For tri-state cycling on that node, the system SHALL treat this situation as **all checked** when every loaded descendant that is missing from the checked-key set has its checkbox disabled due to coverage by a selected ancestor. The system SHALL NOT treat it as mixed solely because descendant keys are omitted while the parent key is checked and descendants are covered-disabled.

#### Scenario: User unchecks after checking a folder that covers loaded children

- **WHEN** the user checks a folder whose descendants are present in the loaded tree and covered by the selection (descendant checkboxes disabled)
- **AND** the merged checked keys contain the folder key but not the individual descendant keys
- **THEN** the next checkbox or name-click toggle on that folder transitions to unchecked (and updates `selectedSources` / synced unchecked tracking consistently)

#### Scenario: True mixed descendants still use indeterminate path

- **WHEN** a parent node is checked and at least one loaded descendant remains interactive (checkbox not disabled) and is not in the checked-key set
- **THEN** the tri-state logic SHALL NOT force **all checked** solely from the parent key; the user MUST still be able to reach the indeterminate transition per the existing mixed-descendant rules
