## Context

Rich-text links are parsed in `src-tauri/src/mcp.rs` from Feishu `text_run.text_element_style.link.url` JSON strings and passed through to Markdown as `[text](url)` in `render.rs`. Some API responses ship the entire absolute URL percent-encoded, which must be decoded once before emission.

## Goals / Non-Goals

**Goals:**

- Detect percent-encoded absolute `http`/`https` URLs at extraction time and normalize them to standard forms.
- Keep already-correct `http://` and `https://` URLs unchanged.
- Add a focused unit test for the regression case.

**Non-Goals:**

- Rewriting arbitrary non-HTTP schemes, relative links, or Feishu-internal link forms.
- Changing Markdown preview or frontend-only paths (this bug is in the Rust sync/renderer pipeline).

## Decisions

- **Normalize at parse time** in `extract_text_from_elements`, so every downstream consumer of `RichSegment.link` sees a consistent URL.
- **Gate decoding** on the observation that the raw string does not already start with `http://` or `https://`, but after `urlencoding::decode` it does—avoids double-processing normal URLs that legitimately contain `%` in query or path segments.
- Reuse the existing `urlencoding` dependency already listed in `Cargo.toml`.

## Risks / Trade-offs

- **Malformed or partial percent-encoding** → Decoding may fail; we keep the original string (decode is fallible via `Result`).
- **Unusual schemes encoded** (e.g. `mailto:`) → Out of scope; unchanged unless we extend the prefix list later.
