## Context

The current sync app can discover accessible knowledge bases and synchronize documents, but its source-selection model still treats a knowledge base as the smallest selectable unit. That is no longer sufficient for the intended workflow because users often need to sync only one directory subtree or one document from a large knowledge base, especially when validating a new connection, testing incremental sync behavior, or exporting a focused subset that mirrors a reference project.

At the same time, the current local output mapping does not fully preserve the knowledge base's folder hierarchy and file naming. Even when the content itself is correct, users cannot easily compare the synced result against the source tree because the local structure is flatter or app-defined rather than source-defined. This weakens trust in the sync result and makes later incremental updates or renamed/moved documents harder to reason about.

Primary constraints:
- The app remains reference-aligned in structure, so source selection should feel like a refinement of the existing sync flow rather than a new workflow.
- The backend owns sync planning and filesystem writes, so authoritative scope filtering and final path resolution must not depend on frontend-only heuristics.
- Incremental sync state must remain stable when users switch between whole-space, folder, and file scopes.
- Local output should stay deterministic across repeated runs and reflect source moves or renames without leaving the manifest ambiguous.

Stakeholders include users syncing a small subset of a large knowledge base, developers maintaining manifest/path stability, and maintainers comparing this app's behavior with the reference project.

## Goals / Non-Goals

**Goals:**
- Allow users to select an entire knowledge base, a directory subtree, or an individual document as sync scope.
- Build sync queues only from the selected scope while preserving incremental sync behavior for in-scope documents.
- Mirror the source knowledge base hierarchy and document naming in the local Markdown output deterministically.
- Surface the selected scope clearly before sync starts and when users inspect prior tasks.

**Non-Goals:**
- Redesign the broader page structure or replace the current sync-first shell.
- Introduce arbitrary user-defined output renaming or manual local folder remapping.
- Change authentication, permission, or connection-validation behavior beyond what is needed to load scoped source trees.
- Solve every possible cross-run cleanup problem for documents that were synced previously under a wider scope and are later excluded by a narrower selection.

## Decisions

1. **Represent sync selection as typed scoped roots**
   - Decision: The sync planner will treat each selected source as a typed scoped root with stable identifiers such as `space`, `folder`, or `document`, plus its knowledge-base-relative ancestor path metadata.
   - Rationale: This provides a single model that can describe whole-space sync, subtree sync, and single-document sync without special-casing the planner for each UI gesture.
   - Alternative considered: Store only a list of selected document IDs after tree selection; rejected because folder-level intent and later path reconstruction would be lost.

2. **Preserve knowledge-base-relative path metadata separately from final local paths**
   - Decision: Discovery and planning data will carry authoritative source-relative folder segments and document naming metadata, and the backend path-mapping step will derive the final local output path from that source structure plus the configured sync root.
   - Rationale: Separating source structure from local path resolution keeps the mapping deterministic and lets the backend mirror source moves or renames cleanly.
   - Alternative considered: Persist only the final output path; rejected because it makes it harder to reason about source-driven path changes and scoped filtering.

3. **Mirror the full source hierarchy from the knowledge base root**
   - Decision: Local Markdown output will preserve the document's path relative to the knowledge base root, even when the user syncs only a nested folder or single file.
   - Rationale: This most directly satisfies the requirement that local naming and path structure remain consistent with the knowledge base and avoids special local layouts for narrow scopes.
   - Alternative considered: Rebase output relative to the selected folder; rejected because it breaks consistency between narrow-scope and whole-space sync runs.

4. **Make folder selection inclusive by subtree and document selection singular**
   - Decision: Selecting a folder syncs that folder and all descendant documents; selecting a document syncs only that document; selecting a knowledge base syncs all documents in that space.
   - Rationale: These rules match user expectations from tree-based selection and remain straightforward to explain and test.
   - Alternative considered: Allow mixed include/exclude patterns inside a subtree; rejected for now because it adds complexity beyond the requested parity gap.

5. **Expose normalized scope summaries in the UI and task metadata**
   - Decision: Sync creation and task history will show a concise scope summary such as knowledge base name plus selected folder/document path, alongside the mirrored output destination context.
   - Rationale: Users need to confirm both "what did I sync?" and "where did it go?" when working with narrower scopes.
   - Alternative considered: Show scope details only during initial selection; rejected because task review later would lose that context.

## Risks / Trade-offs

- **[Tree discovery for scoped selection may require more metadata than current space-only loading]** -> Mitigation: keep the scope model small and fetch only the metadata needed for path reconstruction and selection display.
- **[Mirroring the full source hierarchy can create deeper local paths than current output]** -> Mitigation: keep path generation deterministic and surface the resolved destination clearly before sync starts.
- **[Narrowing scope after a wider previous sync can leave older local files outside the new scope]** -> Mitigation: define this change around queueing and mapping correctness, not automatic cleanup, and record enough manifest context for future cleanup work.
- **[Folder/document moves in the source tree can look like deletes plus creates if path metadata is incomplete]** -> Mitigation: persist stable source IDs together with source-relative path metadata and update mappings deterministically on rename or move.

## Migration Plan

1. Extend source discovery and selection contracts so the frontend can load and choose knowledge base trees at folder/document granularity.
2. Update backend sync planning to accept typed scoped roots and queue only in-scope documents.
3. Extend manifest and mapping logic to preserve source-relative path metadata and derive local output paths from it.
4. Update sync setup and task views to summarize selected scope and mirrored output location clearly.
5. Validate with whole-space, folder-only, and single-document sync runs, including rename/move scenarios within the source tree.
6. Rollback strategy: fall back to whole-space-only planning while retaining backward-compatible manifest fields if scoped selection or mirrored mapping causes regressions.

## Open Questions

- Does the current Feishu integration already expose enough tree metadata to distinguish folders from documents without extra round trips?
- Should the UI allow multi-select across multiple folders/documents in one knowledge base now, or keep the first version to a single scoped root per sync?
- When a document name contains filesystem-hostile characters, should the mirrored local name prefer the exact source title with sanitization, or a stable fallback that preserves display title separately?
