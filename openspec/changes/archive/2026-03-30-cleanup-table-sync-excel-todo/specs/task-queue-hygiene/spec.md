## ADDED Requirements

### Requirement: Clear stale active TODO items after completion is verified
The workflow MUST allow a task run to treat an active TODO item as cleanup-only when the implementation is already present in the codebase and archived OpenSpec evidence confirms that the underlying work was completed earlier.

#### Scenario: Active task is already completed and already recorded
- **WHEN** `TODO.md` still marks a task as active
- **AND** the current implementation already contains the required behavior
- **AND** an archived OpenSpec change and an existing `DONE.md` entry both confirm that the task was completed earlier
- **THEN** the workflow removes the stale active entry from `TODO.md` instead of reopening implementation work

#### Scenario: Active task is already completed but lacks queue-specific DONE wording
- **WHEN** `TODO.md` still marks a task as active
- **AND** the current implementation already contains the required behavior
- **AND** an archived OpenSpec change confirms that the task's implementation was completed earlier
- **AND** `DONE.md` does not yet contain a completion note that matches the current queue wording
- **THEN** the workflow treats the run as cleanup-only
- **AND** it may append one concise verification record to `DONE.md` before clearing the stale TODO entry

### Requirement: Avoid duplicate completion records during cleanup-only runs
The workflow MUST preserve existing completion evidence and MUST avoid duplicate `DONE.md` history during cleanup-only runs, while still allowing a first-time verification note when the current active queue wording has no matching completion entry yet.

#### Scenario: DONE already contains the completion record
- **WHEN** the verified task already has a matching completion record in `DONE.md`
- **THEN** the workflow updates `TODO.md` as needed
- **AND** it leaves the existing `DONE.md` history unchanged

#### Scenario: DONE lacks a queue-specific completion record
- **WHEN** the verified task is cleanup-only
- **AND** `DONE.md` has no matching completion record for the current active queue item
- **THEN** the workflow appends a single concise verification record for that queue item
- **AND** it MUST NOT add more than one new completion record for the same cleanup-only run
