## 1. Browser URL correction

- [ ] 1.1 Update the knowledge-tree browser action to pass the document identifier for document nodes instead of only the node token.
- [ ] 1.2 Refactor the browser-opening helper so document URLs use `documentId` and bitable URLs keep using their existing token-based URL.

## 2. Regression coverage

- [ ] 2.1 Add focused tests for Feishu browser URL generation covering document, subtree-capable document, and bitable nodes.
- [ ] 2.2 Run the relevant test suite and confirm the browser-opening contract remains valid.
