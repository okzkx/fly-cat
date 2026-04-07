## Why

On the primary knowledge base sync screen, the Card header shows the page title and the task-list entry on the left while several actions (refresh, force update, batch delete, start sync) sit in the `extra` slot on the right. With default Ant Design Card head styling (single-line ellipsis on the title region), the left title and task summary can be clipped or visually covered when the right-side action group needs horizontal space.

## What Changes

- Adjust the sync workspace Card header layout so the title line (including the “飞猫助手知识库同步” label and the task-list control) remains readable and is not obscured by the right-side action buttons.
- Use flex and wrapping semantics appropriate for narrow windows and long task-summary text.

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `sync-focused-application-experience`: Add a requirement that the main sync Card header must keep the title and task-list affordance usable alongside the action cluster.

## Impact

- Frontend: `src/components/HomePage.tsx` (main sync Card `title` / `extra` layout and Card `styles`).
