## Context

The current scoped source browser appears to materialize too much of the knowledge base tree at once when a knowledge base is expanded. This makes it difficult for users to understand what belongs to the current level versus deeper descendants. In parallel, some Feishu Bitable items are being mapped into the same shape as directories, which causes the UI to render an incorrect expandable node and undermines trust in scoped selection.

This change touches both the source-discovery contract and the tree interaction model. The sync planner should continue to operate on supported scope targets, but the discovery layer must become more explicit about node kind, direct-child boundaries, and whether a node can expand.

## Goals / Non-Goals

**Goals:**
- Ensure each expansion action loads and renders only the direct children of the expanded knowledge base or parent node.
- Separate node kind from expandability so Bitable and other non-directory content cannot be mistaken for folders.
- Keep scoped selection summaries and downstream planner inputs aligned with the visible source hierarchy.

**Non-Goals:**
- Adding new sync pipeline support for Bitable content export or Markdown rendering.
- Redesigning the overall sync setup page beyond tree loading, node labeling, and selection trustworthiness.
- Changing mirrored local output rules for normal document synchronization.

## Decisions

### Decision: Use level-by-level child loading semantics
The discovery contract will treat every expansion request as "return direct children for this parent only" rather than "return an entire descendant subtree." This matches the user's mental model, reduces initial tree noise, and avoids precomputing deep descendants that may never be opened.

Alternatives considered:
- Keep full-subtree loading and filter it in the UI. Rejected because it preserves overfetching and keeps the contract ambiguous.
- Preload a fixed number of descendant levels. Rejected because it still leaks deeper hierarchy unexpectedly and complicates cache invalidation.

### Decision: Model node type explicitly and derive expandability from type plus child metadata
Discovery responses should distinguish at least knowledge-base, directory, document, and Bitable-like nodes. Expandability should not be inferred from loose heuristics such as missing content or generic child containers. Bitable nodes will be treated as non-directory leaf nodes unless future capability work explicitly adds child-bearing semantics for them.

Alternatives considered:
- Continue using a folder-vs-file heuristic. Rejected because it caused the Bitable misclassification.
- Hide unknown node types entirely. Rejected because it drops potentially useful source context and obscures why a visible item is not a folder.

### Decision: Preserve existing scoped selection rules for supported targets
Whole knowledge base, directory subtree, and individual document selection remain the supported sync scopes. The UI can display Bitable items truthfully as leaf nodes without implying that they introduce a new synchronized scope type in this change. This keeps the fix narrow and avoids accidental backend scope-contract expansion.

Alternatives considered:
- Make Bitable immediately selectable as a first-class sync target. Rejected because the rendering and content pipeline implications are not defined in the current requirements.

## Risks / Trade-offs

- [Cached subtree data becomes incompatible with one-level expansion] -> Normalize cached entries around parent-id keyed direct children and invalidate older subtree-shaped cache entries when needed.
- [Backend adapters still emit ambiguous node types] -> Add explicit mapping and validation at the adapter boundary before tree nodes reach the UI.
- [Users may expect Bitable to sync once it is shown explicitly] -> Label it truthfully as a non-directory leaf node and avoid presenting folder-like expansion affordances.

## Migration Plan

- Update source discovery responses and any frontend adapters to return or derive direct-children collections per parent node.
- Update the tree state management layer to request children lazily on expansion and to stop rendering grandchildren until their own parent is opened.
- Update node rendering metadata so Bitable items use a non-folder presentation and do not expose directory expansion controls.
- Validate that supported sync scope selection and summary rendering still produce the same planner inputs for knowledge bases, folders, and documents.

## Open Questions

- Should Bitable nodes be shown as selectable-but-unsupported, or simply visible and non-selectable in the current UI?
- Is the authoritative node type available directly from the Feishu API payload, or does the adapter need a fallback classification rule for older payload shapes?
