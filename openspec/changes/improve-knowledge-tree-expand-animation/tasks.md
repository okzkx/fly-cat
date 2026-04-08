## 1. Tree rendering

- [x] 1.1 Extract the knowledge-tree title row into lighter memo-friendly components with a stable inline layout.
- [x] 1.2 Remove repeated per-node sync-status and discovered-id calculations that currently scale with visible row count.

## 2. Viewport and verification

- [x] 2.1 Bound the knowledge tree to a fixed-height internal scroll viewport so large trees render through the Tree virtualization path.
- [x] 2.2 Verify that expand/collapse, selection, preview, and row actions still behave correctly after the optimization.
