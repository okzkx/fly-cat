## Why

The current sync flow stops at whole-knowledge-base selection and does not preserve the source knowledge base's folder/file naming structure in local output. This makes the app diverge from the reference project and forces users to re-sync more content than needed while making the resulting Markdown tree harder to recognize and navigate.

## What Changes

- Allow users to select scoped sync sources inside a knowledge base, including the whole knowledge base, a specific directory subtree, or an individual document.
- Preserve source-relative directory hierarchy and document naming when writing synced Markdown so the local output mirrors the knowledge base structure.
- Keep sync planning and incremental state aware of the selected scoped roots so unchanged items outside the chosen subtree or file are not queued.
- Surface the selected source scope clearly in the sync setup and task experience so users can verify what will be synchronized and where it will land locally.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `knowledge-base-source-sync`: expand source discovery and planning from whole-space selection to scoped directory and file selection within a knowledge base.
- `mcp-markdown-content-pipeline`: change local file mapping rules so output paths and file names mirror the source knowledge base structure deterministically.
- `sync-focused-application-experience`: refine sync configuration and task visibility so users can review the selected knowledge base scope and understand the mirrored local output structure.

## Impact

- Affects frontend source-selection UX, including how knowledge base content trees are loaded, selected, and summarized before sync starts.
- Affects backend sync planning, manifest bookkeeping, and path mapping because selected scopes and source-relative paths must remain stable across incremental runs.
- Affects Markdown output layout and rename handling because local paths must track authoritative knowledge base folder/document structure instead of a flatter or app-defined mapping.
