## Why

The current knowledge base source tree expands too aggressively when a knowledge base is opened, which makes the scope browser noisy and harder to understand. The source classifier also misidentifies some Feishu Bitable items as directories, causing users to see incorrect node types and making scoped selection unreliable.

## What Changes

- Change knowledge base tree loading so expanding a knowledge base shows only its immediate child nodes.
- Change folder expansion behavior so expanding a parent document or directory reveals only its direct children and does not render deeper descendants until those parents are expanded explicitly.
- Correct source-node classification so Feishu Bitable items are represented as table-like leaf nodes instead of directory nodes.
- Preserve scoped selection behavior for supported scope targets while keeping lazy expansion and displayed structure consistent with the actual source hierarchy, and render Bitable items as non-directory leaf nodes with their actual type.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `knowledge-base-source-sync`: refine source discovery contracts so tree nodes load and classify immediate children correctly, including Bitable nodes that must not masquerade as directories.
- `sync-focused-application-experience`: refine the source selection tree so each expansion step reveals only one level of children and keeps node-type presentation trustworthy.

## Impact

- Affects frontend knowledge base tree rendering, node expansion state, and source-type icons or labels in sync setup.
- Affects backend or adapter source discovery mapping that converts Feishu knowledge base items into typed tree nodes for the UI and sync planner.
- Reduces accidental overexposure of deep descendants during scoped selection and prevents Bitable items from being treated as expandable directories.
