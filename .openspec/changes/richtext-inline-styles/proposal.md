# Proposal: richtext-inline-styles

## Summary

Preserve Feishu inline text styles (bold, italic, strikethrough, links) through the sync pipeline by replacing plain `String` text with a `RichText` type that carries style segments, and rendering them as Markdown inline syntax.

## Motivation

Currently `extract_text_from_elements` strips all inline formatting from Feishu rich text elements. Bold, italic, strikethrough, and hyperlink information present in `text_run` elements is discarded, producing plain-text output that loses important document semantics.

## Approach

1. Define a `RichText` type in `model.rs` as a sequence of styled text segments (`RichSegment`), where each segment has a `style` (bold, italic, strikethrough, link) and a `content` string.
2. Refactor `extract_text_from_elements` in `mcp.rs` to return `RichText` instead of `String`, reading `text_element_style` from each `text_run`.
3. Update `RawBlock` and `CanonicalBlock` variants that carry text to use `RichText` instead of `String`.
4. Update `render_markdown` in `render.rs` to render `RichText` as Markdown inline syntax: `**bold**`, `*italic*`, `~~strike~~`, `[text](url)`.

## Scope

- `src-tauri/src/model.rs` -- add `RichText`, `RichSegment`, `TextStyle`
- `src-tauri/src/mcp.rs` -- refactor `extract_text_from_elements`, update `RawBlock`, parsing
- `src-tauri/src/render.rs` -- update `render_markdown` to render `RichText`

## Risk

Low. The change is internal to the sync pipeline. Existing tests need updating to use the new `RichText` type, but no external API changes.
