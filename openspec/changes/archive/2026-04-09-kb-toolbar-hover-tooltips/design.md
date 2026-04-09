## Approach

- Use `Tooltip` from `antd` with concise Chinese `title` strings aligned with existing button labels and product copy (refresh vs force vs delete vs start sync).
- Keep button `disabled` / `loading` logic unchanged; where Ant Design does not fire hover on a disabled control, wrap the `Button` in `<span style={{ display: 'inline-block' }}>` (or equivalent) so the tooltip still shows on hover, following Ant Design’s documented pattern.
- Tree row actions already use native `title` on some buttons; replace or supplement with `Tooltip` for consistent styling and to support the disabled-wrapper pattern for **重新同步** when applicable.

## Non-goals

- No changes to which documents are targeted, API calls, or task creation rules from prior bulk-toolbar work.
- No new user-visible strings beyond tooltip bodies (no renaming buttons).

## Validation

- `npm run typecheck`
- `npm test` (existing unit tests)
