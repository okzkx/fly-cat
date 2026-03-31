# Design: richtext-inline-styles

## Data Model

```rust
/// A single styled segment of text
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct RichSegment {
    pub content: String,
    pub bold: bool,
    pub italic: bool,
    pub strikethrough: bool,
    pub link: Option<String>,
}

/// Rich text composed of styled segments
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct RichText {
    pub segments: Vec<RichSegment>,
}
```

## Key Design Decisions

### Flat segment model instead of nested styles

Rather than using an enum for style types (Bold, Italic, etc.), each segment carries boolean flags. This is simpler because Feishu `text_run` elements can have multiple overlapping styles (e.g., bold + italic), and a flat model handles this naturally.

### RichText as a wrapper struct

Using `RichText { segments: Vec<RichSegment> }` instead of a type alias gives us a place to add helper methods (like `to_plain_text()` for backward compatibility).

### Conversion strategy

`RawBlock` text fields change from `String` to `RichText`. The canonical model follows. `render_markdown` gets a helper `render_rich_text` that converts `RichText` to a Markdown string.

### Block variants affected

All block types that contain text:
- Heading: `text` field
- Paragraph: `text` field
- OrderedList/BulletList: `items` field (Vec of RichText)
- Quote: `text` field
- Table: `rows` field (Vec of Vec of RichText)
- Todo: `items` field (Vec of (bool, RichText))
- CodeBlock: `code` field stays String (code blocks don't have inline styles)
