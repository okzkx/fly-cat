## Why

Users need to preview document content without changing sync selection, and to toggle checkboxes for batch sync without the preview pane jumping or opening. Today, tying preview to the same interaction as selection makes both actions accidental and noisy.

## What Changes

- Clicking the document **title** (name row) opens or updates the markdown preview only; it does **not** toggle the sync checkbox.
- Clicking the **checkbox** toggles inclusion in sync selection only; it does **not** open or change the preview pane.
- No other tree behaviors (expand/collapse, folder actions) are intentionally changed beyond isolating these two handlers.

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `knowledge-tree-display`: Document row interactions SHALL separate preview activation from checkbox selection; each control SHALL have a single responsibility.
- `knowledge-doc-markdown-preview`: Preview SHALL follow the user’s explicit document title (preview) selection, not checkbox state alone.

## Impact

- Frontend knowledge tree component(s) that render document rows with checkboxes and title clicks.
- Preview state wiring: ensure preview key follows title-click selection, not checkbox-driven `selectedKeys` if that was previously shared.
