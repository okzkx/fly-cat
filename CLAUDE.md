# Project Memory

## OpenCat Workflow Rules

### Subagent patience

- When an `opencat-work` task subagent has started successfully and there is no explicit failure signal, do not treat it as stuck just because it has not produced a new message for a short time.
- Allow at least 10 minutes with no new subagent response before deciding it may be hung.
- During that 10 minute window, avoid frequent `resume` calls or status-check follow-ups whose only goal is to force output.
- Prefer low-frequency polling and patient waiting while the subagent is executing a long-running workflow.
- Intervene earlier only when there is clear evidence of failure, such as an explicit error, a crashed process, or a user request to interrupt.
