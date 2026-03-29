# disable-downloaded-doc-selection

## Motivation

When browsing the knowledge base tree, users cannot distinguish documents that have already been downloaded from those that haven't. This leads to wasted time re-selecting and re-downloading documents that already exist in the output folder.

## Goal

Disable checkbox selection for documents that already exist in the local sync output folder. Only documents that have not yet been downloaded should be selectable via checkbox.

## Scope

- Load the manifest (`.feishu-sync-manifest.json`) document IDs on app bootstrap or when the sync root changes
- Pass the set of downloaded document IDs to the tree component
- Mark tree nodes whose `documentId` is in the manifest as `disableCheckbox: true`
- Affects `HomePage.tsx`, `App.tsx`, `tauriRuntime.ts`, `commands.rs`

## Non-Goals

- Visual differentiation (e.g., strikethrough or opacity) for already-downloaded items — can be added later
- Automatically unchecking already-downloaded items from existing selections — selectedSources are preserved as-is
- Clearing the manifest — out of scope

## Risks

- Performance risk if manifest grows very large (thousands of records). Mitigation: the manifest is loaded once on bootstrap as a `Set<string>` of document IDs — O(1) lookup per tree node.
- Browser runtime has no manifest file. Mitigation: return an empty set in browser mode; all documents remain selectable.
