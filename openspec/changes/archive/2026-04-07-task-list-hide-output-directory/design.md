## Context

`TaskListPage` uses Ant Design `Table` with a column bound to `outputPath` and repeats the path in the expandable section. Output path remains on `SyncTask` for persistence and other flows.

## Goals / Non-Goals

**Goals:**

- Stop rendering output directory on the task list page only.

**Non-Goals:**

- Changing backend storage, sync path selection on HomePage, or settings copy about the Markdown root.

## Decisions

- **Remove column and expanded line** — Smallest change; no new toggles or settings.
- **Keep `outputPath` on the model** — Other code and persistence may still rely on it.

## Risks / Trade-offs

- Users who relied on the list to copy the path → **Mitigation:** path is still available when creating a task and in settings documentation; scope is intentionally narrowed to the list UI.
