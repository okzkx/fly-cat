# Tasks: richtext-inline-styles

## T1: Define RichText types in model.rs
- [ ] Add `RichSegment` struct with content, bold, italic, strikethrough, link fields
- [ ] Add `RichText` struct wrapping Vec<RichSegment>
- [ ] Add `RichText::plain()` and `RichText::to_plain_text()` helpers
- [ ] Update `CanonicalBlock` variants to use `RichText`

## T2: Migrate RawBlock to use RichText in mcp.rs
- [ ] Update `RawBlock` enum variants (Heading, Paragraph, OrderedList, BulletList, Quote, Table, Todo)
- [ ] Keep `CodeBlock` code field as String

## T3: Refactor extract_text_from_elements to return RichText
- [ ] Parse `text_element_style` from each `text_run`
- [ ] Build `RichSegment` per element with style flags
- [ ] Update `extract_text_from_block` return type
- [ ] Update all callers of these functions

## T4: Update render_markdown for inline styles
- [ ] Add `render_rich_text()` helper
- [ ] Handle bold, italic, strikethrough, link, and combinations
- [ ] Update all block renderers to use RichText rendering

## T5: Update conversion layer
- [ ] Update RawBlock -> CanonicalBlock conversion
- [ ] Ensure RichText passes through correctly

## T6: Update tests
- [ ] Update existing tests to use new RichText types
- [ ] Add new tests for inline style parsing
- [ ] Add new tests for inline style rendering
- [ ] Verify `cargo check` and `cargo test` pass
