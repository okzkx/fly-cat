## 1. Parser fix

- [x] 1.1 Update Feishu block parsing to recognize `block_type` `27` as an image block.
- [x] 1.2 Preserve compatibility for the previously assumed `block_type` `28`.

## 2. Regression coverage

- [x] 2.1 Add a unit test for parsing a current Feishu image block payload.
- [x] 2.2 Update nested traversal coverage to exercise the current image block type.

## 3. Validation

- [x] 3.1 Run targeted Rust tests for Feishu block parsing and image-aware sync behavior.
