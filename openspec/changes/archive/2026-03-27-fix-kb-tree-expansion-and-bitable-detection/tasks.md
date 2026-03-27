## 1. Discovery Contract And Classification

- [x] 1.1 Update knowledge base source discovery mapping to emit explicit node-type and expandability metadata, including classifying Feishu Bitable items as non-directory leaf nodes.
- [x] 1.2 Refactor scoped tree data loading to store and return direct children per expanded parent instead of materializing deeper descendant subtrees in a single expansion result.

## 2. Source Tree Interaction

- [x] 2.1 Update the sync setup source tree so expanding a knowledge base or parent node renders only its immediate children and loads deeper levels lazily when that child is expanded.
- [x] 2.2 Update node rendering and selection affordances so Bitable items are shown with a non-folder presentation and do not expose misleading directory expansion controls.

## 3. Validation

- [x] 3.1 Add automated coverage for one-level expansion behavior and Bitable leaf classification across source discovery and tree state handling.
- [ ] 3.2 Manually validate whole-knowledge-base expansion, parent-document expansion, and Bitable rendering in the scoped source selection flow.
