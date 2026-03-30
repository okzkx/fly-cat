## Context

The knowledge-tree UI already exposes a browser action for document and bitable nodes, and a recent fix switched that action to the correct browser-opening API. However, the document branch still uses the tree `nodeToken` when it builds a Feishu `docx` URL. In the source tree model, document nodes carry both a `nodeToken` and a `documentId`, and only the document identifier is stable for direct document browsing.

The bug is most visible for subtree-capable document nodes inside a knowledge-base hierarchy. Those nodes are valid document selections for sync, but opening `https://feishu.cn/docx/<nodeToken>` resolves to a missing page.

## Goals / Non-Goals

**Goals:**
- Make document browser actions use the document identifier that Feishu expects for `docx` URLs.
- Keep bitable browser actions unchanged.
- Add a focused regression seam so URL selection can be verified without relying on a real desktop opener.

**Non-Goals:**
- Add folder preview or browser opening for folder-only knowledge-base nodes.
- Redesign the knowledge tree action layout.
- Introduce backend commands for browser launching.

## Decisions

Document URLs will be built from `documentId`, while bitable URLs will continue to use `nodeToken`.
Rationale: the frontend data model already distinguishes document IDs from tree node tokens, and the existing sync/discovery pipeline treats `documentId` as the canonical document identifier. Reusing that identifier for browser navigation aligns the opener behavior with the rest of the app and fixes subtree-capable document nodes without changing backend contracts.

The browser helper will accept structured identifiers instead of only a single token string.
Rationale: the current helper signature makes it too easy to pass the wrong identifier for a given node type. Accepting `kind` plus the relevant identifiers keeps the call site explicit and lets the helper reject invalid document calls that omit `documentId`.

Regression coverage will target URL generation as a pure function.
Rationale: opener side effects are platform-specific, but URL selection is deterministic. A small pure helper test gives durable coverage for the bug without introducing brittle environment-dependent tests.

## Risks / Trade-offs

- [Call sites may still pass the wrong fields] -> Centralize URL construction in one helper and make document calls fail fast when `documentId` is missing.
- [Spec and implementation drift from earlier `<token>` wording] -> Update the delta spec in the same change so archive sync preserves the corrected contract.
- [Browser-mode fallback could diverge from Tauri behavior] -> Reuse the same URL builder for browser-mode and Tauri-mode paths.
