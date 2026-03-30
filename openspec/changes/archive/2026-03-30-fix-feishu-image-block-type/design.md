## Context

The live synced output for documents like `ProjectStorm/美术模块/动画/死锁动画` contains no Markdown image syntax and no recorded `imageAssets`, even though the document is expected to include images. Investigation shows the active parser in `src-tauri/src/mcp.rs` only maps `block_type` `28` to `RawBlock::Image`, while the Feishu MCP tool descriptor documents image blocks as `block_type` `27`.

## Goal

- Preserve images from current Feishu block payloads without changing the existing render or asset-download pipeline.

## Non-Goals

- Do not redesign block traversal.
- Do not change image asset storage paths or hash generation.
- Do not add support for unrelated Feishu block types in this change.

## Decision

### Accept both `27` and `28` as image blocks

Treat `27` as the current Feishu image block type and retain `28` as a compatibility alias. This is the smallest safe fix because the downstream pipeline already knows how to download and render image assets once a block is classified as `RawBlock::Image`.

## Validation

- Add a unit test that parses a `block_type` `27` payload into `RawBlock::Image`.
- Update the nested block traversal regression fixture to use the current image block type.
- Run targeted Rust tests for `mcp.rs` and sync/render behavior.
