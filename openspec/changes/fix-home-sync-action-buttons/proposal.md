## Why

On the authenticated home workspace, the knowledge-base sync Card header lost the primary action row (**开始同步**, **全部刷新**, **强制更新**, **批量删除**) for typical window sizes: controls were still in the React tree but clipped or pushed out of view due to Ant Design Card `head-wrapper` remaining a horizontal flex row while `extra` was styled with full width, causing overflow that hides the action cluster.

## What Changes

- Stack the Card `head-wrapper` vertically so the title row and the `extra` action row each occupy their own line, matching the stacked-toolbar product intent.
- Add a scoped class and CSS so the fix survives Ant Design Card defaults without fighting specificity in inline styles alone.

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `sync-focused-application-experience`: Clarify that home workspace sync header actions MUST remain visible (not clipped by overflow) and align layout with the existing “toolbar below title” requirement.

## Impact

- `src/components/HomePage.tsx` (Card `className` / minor style props if needed)
- `src/styles.css` (scoped rules for the home sync Card header wrapper)
