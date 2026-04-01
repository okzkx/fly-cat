## MODIFIED Requirements

### Requirement: Cascading Parent-Child Checkbox Toggle with Tri-State Cycling

When a user clicks the checkbox of a parent node (folder or document with descendants), the system SHALL cycle through three visual states (checked, indeterminate/half-checked, unchecked) with the following cascading behavior.

#### State Transitions

**From UNCHECKED:**

- Transition to CHECKED: check self and all descendant nodes

**From CHECKED:**

- If ALL descendants are currently checked: transition to UNCHECKED (uncheck self and all descendants)
- If SOME descendants are NOT all checked: transition to INDETERMINATE (leave each descendant in its current state; do not change any descendant's check state)

**From INDETERMINATE:**

- Transition to CHECKED: check self and all descendant nodes

#### Simplified Two-State Optimization

When a parent node and ALL of its descendants are in the same state (all checked OR all unchecked), the system SHALL only toggle between checked and unchecked, skipping the indeterminate state entirely.

Parent-child display invariants SHALL hold per product rules: a fully checked parent node SHALL imply every loaded descendant checkbox is rendered checked; a fully unchecked parent SHALL imply all descendants are unchecked; an indeterminate (half-checked) parent SHALL imply descendants are neither all checked nor all unchecked. Descendant checkboxes SHALL NOT be disabled solely because an ancestor scope covers them in `selectedSources`.

#### Scenario: Checking a folder with no previously checked children

- **WHEN** a folder node is unchecked with all descendants unchecked, and the user clicks its checkbox
- **THEN** the folder and all descendant nodes become checked

#### Scenario: Unchecking a folder where all descendants were checked

- **WHEN** a folder node is checked with all descendants checked, and the user clicks its checkbox
- **THEN** the folder and all descendant nodes become unchecked

#### Scenario: Indeterminate state when mixed children

- **WHEN** a folder node is checked but some descendants are unchecked, and the user clicks its checkbox
- **THEN** the folder enters indeterminate state and each descendant retains its current checked/unchecked state unchanged

#### Scenario: Checking from indeterminate state

- **WHEN** a folder node is in indeterminate state and the user clicks its checkbox
- **THEN** the folder and all descendant nodes become checked

#### Scenario: Leaf document toggle unchanged

- **WHEN** a leaf document node (no descendants) checkbox is clicked
- **THEN** the document toggles between checked and unchecked as before

#### Scenario: Parent checked shows all loaded children checked

- **WHEN** a user selects a scope that covers descendants (space, folder, or document with `includesDescendants`) and those descendants are present in the loaded tree
- **THEN** every loaded descendant checkbox is rendered checked and enabled (unless disabled for syncing/pending), not grayed out as non-interactive

## REMOVED Requirements

### Requirement: Tri-state respects scope-only keys for covered descendants

**Reason:** Replaced by expanding the effective checked-key set for the Tree so covered descendants are included in the checked set; gou.md requires visible checked children, not coverage-disabled omitting keys.

**Migration:** None; behavior is strictly more aligned with user-visible selection.
