## 1. Selection and discovery

- [ ] 1.1 Update the frontend sync-scope model and tree-selection helpers so bitable leaves can be selected, normalized, and counted like other leaf sync sources.
- [ ] 1.2 Update backend source validation and discovery so selected bitable leaves and descendant bitables are queued with the metadata required for sync.

## 2. Sync status and incremental planning

- [ ] 2.1 Replace the bitable "不支持" tree status handling with normal per-item sync state rendering.
- [ ] 2.2 Make unchanged-check planning use an export-aware expected output path for table leaves so previously synced `.xlsx` outputs can be skipped safely.

## 3. Regression coverage

- [ ] 3.1 Add focused frontend tests covering bitable selection, subtree coverage, and task summaries.
- [ ] 3.2 Add focused backend/unit coverage for bitable discovery and unchanged-table output-path checks, then run the relevant test suites.
