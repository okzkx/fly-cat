## Context

The home sync workspace uses an Ant Design `Card` with `title` (title + task-list control) and `extra` (bulk actions). Ant Design’s default head title applies single-line ellipsis and a flex layout that can prevent the title region from shrinking correctly (`min-width` / overflow), so the left cluster can be clipped or overlapped when `extra` is wide.

## Goals / Non-Goals

**Goals:**

- Keep the sync page title and task-list entry visible and clickable beside the action cluster.
- Degrade gracefully on narrow widths (wrap instead of overlap).

**Non-Goals:**

- Redesigning the entire toolbar or moving actions into a menu (unless wrapping alone is insufficient).

## Decisions

- Use Card semantic `styles` (`title`, `extra`) to set `minWidth: 0`, allow normal wrapping, and keep `extra` from shrinking.
- Wrap the title row content in a flex container with `flexWrap: "wrap"` so long task summaries move to the next line instead of fighting the action buttons.

## Risks / Trade-offs

- **[Risk]** Overriding title overflow may show more lines in the header → **Mitigation:** Acceptable; header min-height already grows in Ant Design when content wraps.
