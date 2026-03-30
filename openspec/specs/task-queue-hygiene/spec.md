# Task Queue Hygiene

## Purpose

Define how workflow maintenance should clear stale active TODO items after the underlying implementation has already been completed and recorded elsewhere.

## Requirements

### Requirement: Clear stale active TODO items after completion is verified
The workflow MUST allow a task run to treat an active TODO item as cleanup-only when the implementation is already present in the codebase and the completed work is already documented elsewhere.

#### Scenario: Active task is already completed
- **GIVEN** `TODO.md` still marks a task as active
- **AND** the current implementation already contains the required fix
- **AND** an archived OpenSpec change and an existing `DONE.md` entry both confirm that the task was completed earlier
- **WHEN** the workflow processes that active item
- **THEN** it removes the stale active entry from `TODO.md` instead of reopening implementation work

### Requirement: Avoid duplicate completion records during cleanup-only runs
The workflow MUST preserve existing completion evidence and MUST NOT add a duplicate `DONE.md` record when a correct completion record already exists.

#### Scenario: DONE already contains the completion record
- **GIVEN** the verified task already has a matching completion record in `DONE.md`
- **WHEN** the workflow performs cleanup-only queue maintenance
- **THEN** it updates `TODO.md` as needed
- **AND** it leaves the existing `DONE.md` history unchanged
