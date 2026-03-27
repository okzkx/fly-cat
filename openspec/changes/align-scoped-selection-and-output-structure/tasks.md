## 1. Scoped Source Discovery And Selection

- [ ] 1.1 Extend source discovery contracts so knowledge base data can represent selectable knowledge-base, folder, and document nodes with stable identifiers and source-relative path metadata.
- [ ] 1.2 Implement sync setup UI changes that let users choose a whole knowledge base, a directory subtree, or a single document and show the selected scope summary before sync starts.
- [ ] 1.3 Validate selection behavior so folder selection includes descendants, document selection remains singular, and out-of-scope items are not included accidentally.

## 2. Backend Planning And Manifest Updates

- [ ] 2.1 Update backend sync commands and planner inputs to accept typed scoped roots instead of whole-space-only selection.
- [ ] 2.2 Adjust incremental planning so only in-scope documents are queued while unchanged in-scope documents remain no-op and out-of-scope documents stay excluded.
- [ ] 2.3 Extend persisted manifest entries to store selected scope context and source-relative path metadata needed for retries, audits, and deterministic remapping.

## 3. Mirrored Output Path Mapping

- [ ] 3.1 Refine Markdown output path generation to preserve knowledge-base-relative directory hierarchy under the configured sync root.
- [ ] 3.2 Refine output file naming so local Markdown names follow authoritative source document naming with deterministic sanitization where needed.
- [ ] 3.3 Handle source rename or move cases by updating manifest mapping and local output paths deterministically.

## 4. Task Visibility And Validation

- [ ] 4.1 Update task and history views to show selected source-scope context together with the resolved output destination for each sync run.
- [ ] 4.2 Add automated coverage for scoped queue construction, mirrored path mapping, and rename/move behavior across repeated runs.
- [ ] 4.3 Manually validate whole-knowledge-base, folder-only, and single-document sync flows against the reference behavior, including local output structure checks.
