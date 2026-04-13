## Context

The app uses Ant Design (`antd`) for layout primitives (`Space`) and loading states (`Spin`). Newer `antd` versions deprecate `Space.direction` and `Spin.tip` in favor of `orientation` and `description`.

## Goals / Non-Goals

**Goals:**

- Mechanical prop renames across all in-repo usages.
- Preserve existing layout (`vertical` → `orientation="vertical"`) and loading copy.

**Non-Goals:**

- Upgrading `antd` major version, theme tokens, or unrelated UI polish.

## Decisions

- Use `orientation="vertical"` wherever `direction="vertical"` appeared; horizontal stacks use `orientation="horizontal"` if encountered.
- Use `description={...}` for `Spin` where `tip` was used.

## Risks / Trade-offs

- **Older `antd` typings** → Mitigation: confirm project `antd` version supports these props (already warning implies runtime supports migration target).
