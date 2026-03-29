## Why

The knowledge tree in `HomePage.tsx` displays Chinese Tag labels (整库, 目录, 文档, 含子文档, 多维表格) next to each node. These are redundant because the node icons already clearly indicate the type (cloud icon for space, folder icon for folder, file icon for document, table icon for bitable). Removing these labels reduces visual clutter and makes the tree cleaner.

## What Changes

Remove the five `<Tag>` elements from the tree node renderer in `src/components/HomePage.tsx` (lines 302-306):
- `<Tag color="purple">整库</Tag>` for space nodes
- `<Tag color="gold">目录</Tag>` for folder nodes
- `<Tag color="blue">文档</Tag>` for document nodes
- `<Tag color="geekblue">含子文档</Tag>` for documents with descendants
- `<Tag color="cyan">多维表格</Tag>` for bitable nodes

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

(none — this is a purely cosmetic UI cleanup with no spec-level behavior changes)

## Impact

- **Code**: Only `src/components/HomePage.tsx` is affected (5 lines removed)
- **APIs**: No changes
- **Dependencies**: No changes
- **Other UI**: Task list page labels, scope summary text, and Rust backend labels are unaffected
