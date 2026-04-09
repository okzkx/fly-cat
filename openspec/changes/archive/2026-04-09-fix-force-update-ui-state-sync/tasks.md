## 1. Force-update task sequencing

- [x] 1.1 Split Home-page task creation so force update can queue a pending task before starting it.
- [x] 1.2 Update the force-update flow to reload document sync statuses immediately after strip, then queue the follow-up task before the freshness/alignment phase.

## 2. Immediate UI feedback

- [x] 2.1 Keep freshly stripped document ids rendered as `未同步` while the queued replacement task is still pending.
- [x] 2.2 Remove the queued replacement task if a later force-update step fails before sync actually starts.

## 3. Validation

- [x] 3.1 Run `openspec validate --change fix-force-update-ui-state-sync`.
- [x] 3.2 Run the most relevant frontend checks for the updated force-update flow.
