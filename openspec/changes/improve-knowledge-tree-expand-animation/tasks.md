## 1. Tree rendering

- [ ] 1.1 Extract the knowledge-tree title row into lighter memo-friendly components with a stable inline layout.
- [ ] 1.2 Remove repeated per-node sync-status and discovered-id calculations that currently scale with visible row count.

## 2. Viewport and verification

- [ ] 2.1 Bound the knowledge tree to a fixed-height internal scroll viewport so large trees render through the Tree virtualization path.
- [ ] 2.2 Verify that expand/collapse, selection, preview, and row actions still behave correctly after the optimization.
