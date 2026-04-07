## Context

`HomePage` uses Ant Design `Tree` with `checkable` and `checkStrictly`. Preview content loads in a `useEffect` keyed on `selectedScope`, which the parent updates via `onScopeChange`. Today `handleSelect` both updates scope and invokes `handleTriStateToggle`, and `handleTriStateToggle` calls `onScopeChange` when a node becomes checked—binding preview to checkbox actions.

## Goals / Non-Goals

**Goals:**

- Title row selection updates `selectedScope` (preview + tree `selectedKeys`) only.
- Checkbox toggles sync inclusion via `onToggleSource` only, without changing `selectedScope`.
- If a browser event ever fires `onSelect` for a checkbox interaction, ignore it so preview does not update.

**Non-Goals:**

- Changing cascade / gou rules for checked descendants, sync task behavior, or multi-select summary semantics beyond removing the scope coupling described above.

## Decisions

- **Remove tri-state toggle from `handleSelect`.** Title click shall not call `handleTriStateToggle`.
- **Remove `onScopeChange` from `handleTriStateToggle`.** Checking shall not move “current scope” used for preview.
- **Optional guard in `handleSelect`:** If `nativeEvent.target` is inside `.ant-tree-checkbox`, return early so checkbox-driven `onSelect` does not update preview (defensive for Ant Design versions that bubble).

## Risks / Trade-offs

- Tree highlight (`selectedKeys`) stays on the last title-selected node while the user only operates checkboxes; this matches “preview follows title, not checkbox” and is acceptable.

## Migration Plan

None; client-only behavior change, no data migration.

## Open Questions

None.
