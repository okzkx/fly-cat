## Context

`TODO.md` still marks the directory-opening error as the active P2 task, but the repository already contains both the runtime permission fix and an archived OpenSpec change for that fix. `DONE.md` also already records that this exact queue item was verified as completed. The remaining problem is workflow state drift between the active queue and the completion log.

## Goals / Non-Goals

**Goals:**
- Confirm that the task is a cleanup-only case rather than a missing runtime fix
- Remove the stale active TODO entry without disturbing unrelated queue items
- Keep the workflow evidence consistent by relying on the existing `DONE.md` record

**Non-Goals:**
- Re-implement opener permissions or desktop folder-opening behavior
- Change any other pending TODO items
- Rewrite historical `DONE.md` entries that are already accurate

## Decisions

- Treat this change as a cleanup-only workflow correction rather than a product bug fix.
  Rationale: the codebase already contains `opener:allow-open-path`, and the archived `fix-opener-permission` change documents the original fix.
- Update `TODO.md` directly and leave `DONE.md` unchanged if it already contains the necessary completion evidence.
  Rationale: removing the stale queue entry solves the remaining inconsistency without duplicating history.
- Add a minimal workflow spec describing stale-task cleanup.
  Rationale: the cleanup still needs a valid OpenSpec artifact chain and should document the expected handling of already-completed TODO items.

## Risks / Trade-offs

- [Risk] A stale item could be cleared incorrectly if verification is weak. -> Mitigation: require agreement between current code, archived OpenSpec evidence, and `DONE.md` before treating the task as cleanup-only.
- [Risk] Leaving `DONE.md` unchanged could look incomplete. -> Mitigation: encode in the workflow spec that duplicate completion records are unnecessary when a correct record already exists.
