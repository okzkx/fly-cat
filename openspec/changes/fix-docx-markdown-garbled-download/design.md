## Context

The current sync worker tries the Feishu export-task API first whenever OpenAPI credentials are available. That optimization is valid for export-only objects such as `sheet` and `bitable`, but it is incorrect for normal Feishu documents that the product promises to store as Markdown. Those document exports return binary office payloads, and the worker currently writes them to the Markdown output path derived from the document tree, which produces unreadable `.md` files.

## Goals / Non-Goals

**Goals:**
- Preserve Markdown output for normal document syncs.
- Preserve export downloads for export-only object types.
- Minimize behavior change outside the sync execution branch selection.

**Non-Goals:**
- Redesign the Markdown renderer.
- Change local path naming rules beyond what is required for correct content format.
- Add new export formats for normal documents.

## Decisions

- Restrict the export-task path to export-only object types.
  Rationale: `sheet` and `bitable` already depend on native exported files, while normal documents must remain Markdown per existing specs and local workflow expectations.
- Keep `sync_document_via_export` unchanged for export-only items.
  Rationale: the function itself is still correct for `.xlsx` and similar outputs; the bug is the caller choosing it for Markdown-targeted documents.
- Add regression tests around the branch-selection logic.
  Rationale: the issue came from control flow, so tests should assert which sync path is chosen for each object type.

## Risks / Trade-offs

- [Risk] Some users may have relied on exported `docx` content accidentally replacing Markdown. -> Mitigation: preserve current behavior only for explicit export-only types, which aligns with existing specs and filenames.
- [Risk] Existing binary `.md` files on disk remain until re-synced. -> Mitigation: the fix ensures subsequent syncs rewrite affected Markdown documents through the text rendering path.

## Migration Plan

- No schema or data migration is required.
- After release, users can re-sync affected document scopes to replace binary `.md` files with rendered Markdown.

## Open Questions

- None for this scoped fix.
