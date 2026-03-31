## Context

The sync backend writes Markdown documents and export-only files through different path builders. Markdown output already treats the final path segment as the file name, but export-only output currently joins all `path_segments` as directories and then appends `<title>.xlsx`, which duplicates the final segment for table exports.

## Goals / Non-Goals

**Goals:**
- Make export-only `bitable` / `sheet` outputs land at `.../<parent segments>/<title>.xlsx`.
- Keep the existing knowledge-base-relative hierarchy for parent folders intact.
- Preserve deterministic output paths so manifest-based unchanged detection continues to work.

**Non-Goals:**
- Reclassify knowledge-tree node kinds or change sync discovery semantics.
- Rename exported files or alter export task API behavior.
- Refactor broader path sanitization rules outside this focused bug fix.

## Decisions

- Reuse the same "parent segments as directories, leaf segment as file name" shape that Markdown output already follows, but keep export-only extensions (`.xlsx`) and root handling intact.
- Keep the fix localized to `expected_output_path(...)` because that function already defines the canonical on-disk path used by both export writes and unchanged checks.
- Add a regression test that asserts the exact export path for a nested bitable document so future path changes cannot silently reintroduce the duplicate folder.

## Risks / Trade-offs

- [Existing manifests may point at the old nested path] → The existing export write flow already removes the previous output when the canonical path changes, so migrated items will converge on the corrected path after the next sync.
- [Other export-only types could rely on current behavior] → The change only applies the intended parent/leaf split for export-only outputs and leaves extensions/object-type routing untouched.
