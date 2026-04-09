## Why

**全部刷新** had regressed into stripping local outputs and enqueueing sync tasks for “outdated” checked documents, which contradicts the intended semantics: reconcile manifest version metadata with the server without re-downloading. Users need **开始同步** to remain the sole entry for pulling **未同步** bodies, while **全部刷新** fixes version drift against the remote.

## What Changes

- **全部刷新** again only runs batch `check_document_freshness`, persists freshness metadata, and aligns manifest-backed local revision/update time to the refreshed remote values for the checked synced documents (forced alignment when the check succeeds). It MUST NOT call `prepare_force_repulled_documents`, MUST NOT create or start a sync task, and MUST NOT delete exported files.
- Clarify in spec that **开始同步** only downloads documents that are not classified as unchanged (i.e. not already **已同步** with expected local outputs); skipped documents MUST NOT receive manifest version alignment as part of that run.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `knowledge-tree-display`: tighten **全部刷新** vs **开始同步** behavioral requirements for bulk refresh and default sync.

## Impact

- **Frontend**: `src/components/HomePage.tsx` (`handleBulkFreshnessAction` refresh branch).
- **Specs**: `openspec/specs/knowledge-tree-display/spec.md` (via delta in this change).
