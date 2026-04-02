## ADDED Requirements

### Requirement: Missing local outputs clear synced state
The knowledge tree MUST treat a document or bitable as currently synced only when its manifest-backed successful sync record still points to an existing local output file. If the local output has been deleted after a previous success, the tree MUST stop showing `已同步` for that item and MUST fall back to the unsynced presentation until a later sync writes the file again.

#### Scenario: Force update strips local output before re-sync starts
- **WHEN** a previously synced document keeps its manifest success row but its local output file has just been removed by **强制更新**
- **THEN** the knowledge tree shows that document as `未同步` instead of `已同步`

#### Scenario: Aggregate node stops counting deleted child as synced
- **WHEN** a folder or space contains a child document whose manifest row says success but whose local output file is missing
- **THEN** aggregate sync badges do not count that child toward synced totals

#### Scenario: Re-sync restores synced state after file is written again
- **WHEN** a later sync run rewrites the missing local output for that document successfully
- **THEN** the knowledge tree returns to showing `已同步` for that item
