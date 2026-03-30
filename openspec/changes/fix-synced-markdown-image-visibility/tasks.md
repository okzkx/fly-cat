## 1. Block traversal

- [ ] 1.1 Add recursive descendant block traversal for Feishu document fetching so nested image blocks are preserved in order.
- [ ] 1.2 Add regression coverage for nested block flattening and image-block preservation.

## 2. Image fallback rendering

- [ ] 2.1 Download Feishu OpenAPI image media as local binary assets instead of emitting auth-gated remote URLs.
- [ ] 2.2 Store fallback assets under the fixed sync-root image directory with stable extensions and correct relative Markdown links.

## 3. Validation

- [ ] 3.1 Run targeted Rust and project tests covering image rendering and sync output behavior.
- [ ] 3.2 Re-check the sample synced-document behavior assumptions against current local output and manifest evidence.
