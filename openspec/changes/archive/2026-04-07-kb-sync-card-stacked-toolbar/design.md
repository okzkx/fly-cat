## Context

The home workspace and task list use Ant Design `Card` with `title` and `extra`. Default head layout is a single flex row (`space-between`), which keeps the title and actions on one baseline and feels visually crowded.

## Goals / Non-Goals

**Goals:**

- Stack the Card head so `extra` actions render on a second row, full width, end-aligned with wrapping for narrow widths.
- Preserve existing title content (home: title + task summary control; task list: plain title) without changing behavior of individual buttons.

**Non-Goals:**

- Redesigning colors, typography scale, or moving actions into the Card body as ad-hoc floating toolbars.
- Changing sync or task business logic.

## Decisions

- Use Ant Design Card `styles` (`header`, `title`, `extra`) with `flexDirection: "column"` on the head wrapper, `width: "100%"` and `marginInlineStart: 0` on `extra`, and flex wrap on the action `Space` so narrow windows still behave predictably.
- Apply the same pattern to both `HomePage` and `TaskListPage` for consistency.

## Risks / Trade-offs

- **[Risk] Ant Design internal DOM/class changes could alter head layout** → Mitigation: rely on documented `styles` API; verify visually after upgrade.

- **[Trade-off] Slightly more vertical space used in the header** → Acceptable for clearer scanning and alignment with user request.
