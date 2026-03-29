# synced-doc-checkbox Delta Specification

## Change: knowledge-base-tri-state-checkbox

## ADDED Requirements

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

#### Scenario: Cascading uncheck tracks synced documents for cleanup
- **WHEN** cascading uncheck causes synced documents to become unchecked
- **THEN** those synced document keys are added to `uncheckedSyncedDocKeys` so they will be deleted on sync start

#### Scenario: Cascading check removes from unchecked tracking
- **WHEN** cascading check causes previously unchecked synced documents to become checked
- **THEN** those document keys are removed from `uncheckedSyncedDocKeys`

## MODIFIED Requirements

### Requirement: Parent node half-checked state calculation
The existing requirement for parent half-checked display is updated: the system SHALL compute half-checked keys from the actual checked keys set rather than passing an empty `halfChecked` array. The `checkedKeys` prop MUST only contain truly checked keys; Ant Design's Tree component will compute the visual half-checked state automatically based on parent-child key relationships.

#### Scenario: Half-checked parent computed from children
- **WHEN** a folder node has some but not all descendant keys in the checked keys set
- **THEN** Ant Design Tree renders the folder node with an indeterminate (half-checked) visual state automatically
