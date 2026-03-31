# Specs: richtext-inline-styles

## S1: RichText data types

**File**: `src-tauri/src/model.rs`

Define `RichSegment` and `RichText` structs with `Serialize`/`Deserialize`. Add a `RichText::plain(content: &str)` convenience constructor and a `RichText::to_plain_text(&self) -> String` helper.

## S2: RawBlock migration to RichText

**File**: `src-tauri/src/mcp.rs`

Update all `RawBlock` variants that carry text to use `RichText`:
- `Heading { text: RichText }`
- `Paragraph { text: RichText }`
- `OrderedList { items: Vec<RichText> }`
- `BulletList { items: Vec<RichText> }`
- `Quote { text: RichText }`
- `Table { rows: Vec<Vec<RichText>> }`
- `Todo { items: Vec<(bool, RichText)> }`
- `CodeBlock` keeps `String` for code content

## S3: extract_text_from_elements returns RichText

**File**: `src-tauri/src/mcp.rs`

Refactor `extract_text_from_elements` to return `RichText` by reading `text_element_style` from each `text_run`. Parse:
- `bold: true` -> `bold: true`
- `italic: true` -> `italic: true`
- `strikethrough: true` -> `strikethrough: true`
- `link: { url: "..." }` -> `link: Some(url)`

Update `extract_text_from_block` to return `RichText`.

## S4: CanonicalBlock migration to RichText

**File**: `src-tauri/src/model.rs`

Update `CanonicalBlock` variants to use `RichText` for text fields, matching `RawBlock` changes.

## S5: render_markdown inline style output

**File**: `src-tauri/src/render.rs`

Add `render_rich_text(segment: &RichSegment) -> String` helper that wraps content with appropriate Markdown syntax:
- bold -> `**content**`
- italic -> `*content*`
- strikethrough -> `~~content~~`
- link -> `[content](url)`
- combinations apply all markers (e.g., bold+italic -> `***content***`)

Update all `render_markdown` block handlers to use `render_rich_text`.

## S6: Conversion from RawBlock to CanonicalBlock

**File**: `src-tauri/src/mcp.rs` (wherever the conversion happens)

Update the RawBlock -> CanonicalBlock conversion to pass through `RichText` directly.
