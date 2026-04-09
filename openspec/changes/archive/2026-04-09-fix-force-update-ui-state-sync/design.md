## Context

The current force-update handler performs local strip first, then waits for the shared freshness refresh and manifest alignment pipeline, and only afterwards reloads sync statuses and creates the follow-up sync task. That sequencing leaves a visible gap where disk state has changed but the tree badges, preview eligibility, and task summary still look unchanged.

## Goals / Non-Goals

**Goals:**

- Reflect stripped documents as unsynced immediately after the local cleanup step succeeds.
- Show the follow-up sync task in frontend task state before the slower freshness phase completes.
- Avoid showing freshly stripped documents as `同步中` merely because their replacement task has been queued but not started.
- Remove any queued replacement task if later force-update steps fail before sync actually starts.

**Non-Goals:**

- Changing backend strip semantics or freshness APIs.
- Reworking normal **开始同步** behavior outside the force-update path.

## Decisions

1. **Reload document statuses immediately after strip**
   After `prepareForceRepulledDocuments` returns, the Home page will immediately reload manifest-backed sync statuses. This makes the missing-local-output rule visible right away in the tree and preview pane, instead of waiting for later API work.

2. **Split task creation from task start in the Home page callback**
   The App-level task creation callback will support creating a pending task without starting it immediately. Force update uses this to surface the queued task early, while ordinary sync still creates and starts in one action.

3. **Mask stripped document ids from pending-task syncing badges**
   While force update is still finishing freshness/alignment, the Home page keeps a temporary set of stripped document ids. Those ids render as unsynced even if the queued task is already pending, and the mask is cleared once the queued task is actually started or the flow aborts.

4. **Delete the queued task on late failure**
   If freshness refresh, forced alignment, or task start fails after a pending task has already been created, the frontend deletes that queued task so the task list does not show an entry for a run that never began.

## Risks / Trade-offs

- **Pending task exists briefly before sync starts** -> The UI mask keeps tree badges accurate, and cleanup removes the task if startup fails.
- **More Home page callback surface area** -> Keep the new options narrowly scoped to create/start/delete operations already backed by existing task APIs.
