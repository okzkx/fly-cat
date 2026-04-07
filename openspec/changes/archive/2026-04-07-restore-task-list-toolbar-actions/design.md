## Context

`TaskListPage` uses `Card` with `styles.title.width = "100%"` and actions in `extra`. Ant Design 6 renders title and extra inside `.ant-card-head-wrapper` as a horizontal flex row; a full-width title flex item can overflow-hide the `extra` region on typical viewports.

## Goals

- Guarantee toolbar actions stay visible and wrap on narrow widths.
- Match the proven `HomePage` pattern: one flex container in `title` that holds the heading and `Space` of buttons.

## Non-goals

- Redesigning the task table or sync engine.
- Changing home page layout beyond any shared learnings (no shared extract required for this fix).

## Approach

1. Replace string `title` + `extra` with a single `title` React node: left side heading text, right side `Space` with **清空所有任务** (Popconfirm), **开始等待任务** (`resumeSyncTasks`, disabled when no `pending` tasks), and **返回首页**.
2. Simplify `styles`: drop `extra` slot overrides; keep `title` `overflow: visible` / `whiteSpace: normal` so the flex row is not ellipsized away.
3. Optionally tighten `header` gap to match home.

## Risks

- Low: visual-only restructure; actions reuse existing handlers.
