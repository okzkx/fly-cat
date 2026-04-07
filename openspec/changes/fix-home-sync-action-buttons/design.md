## Context

Ant Design 6 `Card` renders `title` and `extra` inside `.ant-card-head-wrapper`, which defaults to `display: flex` with a **row** direction. The home workspace applied `styles.header` with `flexDirection: "column"` on `.ant-card-head`, but that only stacks the wrapper with optional tabs — it does **not** change the inner wrapper, so title and `extra` stay on one row.

`styles.extra` set `width: "100%"` on the `extra` node. In a horizontal flex row, that forces the `extra` flex item to request the full container width alongside the title, overflowing the head and clipping actions out of view.

## Goals / Non-Goals

**Goals:**

- Restore visible, clickable **开始同步**, **全部刷新**, **强制更新**, and **批量删除** on the home sync Card at typical desktop widths.
- Keep the stacked layout: title + task entry on the first row, actions on the second row, aligned with existing product specs.

**Non-Goals:**

- Redesign task list page header (already has its own stacked styles).
- Change button semantics or disabled rules.

## Decisions

1. **Scoped CSS on `.ant-card-head-wrapper`** — Add a dedicated `className` on the home knowledge-base `Card` and in `styles.css` set `flex-direction: column`, `align-items: stretch`, and a small `gap` on `.home-kb-sync-card .ant-card-head-wrapper`. This overrides Ant Design’s row wrapper without relying on unstable internal selectors beyond the public class names.

2. **Keep existing `styles.extra` for wrapping** — After stacking, `width: 100%` + `justify-content: flex-end` + `flex-wrap` remains valid for the second row.

**Alternatives considered:** Removing `width: 100%` from `extra` only — would reduce overflow on one row but would not satisfy the “toolbar below title” spec; stacking the wrapper is the correct fix.

## Risks / Trade-offs

- **Ant Design upgrades change markup** → Mitigation: scope rules to our Card `className`; if class names change, adjust one CSS block.

## Migration Plan

N/A (front-end layout only).

## Open Questions

None.
