## Context

The current Rust sync pipeline reports success for documents like `ProjectStorm/美术模块/动画/死锁动画`, but the generated Markdown contains no image syntax and the manifest records no `imageAssets`. Code inspection shows two mismatches with the intended behavior:

1. `fetch_document_blocks()` only fetches the document root and its direct children, so images nested under descendant blocks are silently skipped.
2. The OpenAPI image provider returns an authenticated Feishu media URL string instead of downloading bytes, which leaves local Markdown dependent on request headers that normal Markdown renderers cannot send.

## Goals / Non-Goals

**Goals:**
- Preserve descendant image blocks by traversing the full Feishu block tree in document order.
- Download OpenAPI-backed image media to local hashed assets so synced Markdown can render images without Feishu auth headers.
- Keep the fix scoped to the existing Rust sync pipeline and its current manifest model.

**Non-Goals:**
- Do not redesign the overall sync task orchestration.
- Do not add support for every unsupported Feishu block type in this change.
- Do not introduce remote-image validation logic for non-OpenAPI transports.

## Decisions

### Decision 1: Recursively flatten the block tree in depth-first order

Use the existing root block request only to obtain the first-level child IDs, then recursively fetch descendants for each block and append parsed blocks in depth-first document order.

Alternatives considered:
- Keep direct-child traversal and rely on Feishu root responses to already include all images. Rejected because the current synced output and manifest data show that assumption is false for nested image layouts.
- Switch the whole pipeline to export-only document rendering. Rejected because this task is specifically about fixing Markdown sync output with minimal architectural change.

### Decision 2: Download OpenAPI media bytes instead of emitting authenticated remote URLs

Resolve `RawBlock::Image` through the Feishu media download endpoint and return binary content to the renderer. This keeps Markdown self-contained and avoids image links that require bearer headers.

Alternatives considered:
- Keep returning remote URLs and hope local viewers can render them. Rejected because Feishu media endpoints require authenticated headers and are not reliably visible in local Markdown viewers.
- Reintroduce a separate JS-side image rewrite pass. Rejected because the active sync path is already in Rust and should stay authoritative.

### Decision 3: Store assets in the fixed sync-root image directory with detected extensions

Continue using hashed filenames, but derive the file extension from the downloaded response metadata when possible and store assets under the sync root image directory. Markdown should reference those assets through a relative path from the document directory.

Alternatives considered:
- Keep hardcoded `.png` extension. Rejected because it can mismatch the actual media type.
- Keep per-document `_assets` directories. Rejected because the existing spec defines a fixed asset directory under the sync root and central storage avoids duplicate writes.

## Risks / Trade-offs

- [More block API requests] -> Recursive traversal can increase request volume for deeply nested documents; mitigate by keeping traversal focused and deterministic rather than broad refactors.
- [Media download permissions] -> Local fallback depends on `docs:document.media:download`; mitigate by preserving current auth/error classification so permission failures remain diagnosable.
- [Extension inference gaps] -> Some responses may not expose a useful filename; mitigate by falling back to a safe default extension when metadata is missing.
