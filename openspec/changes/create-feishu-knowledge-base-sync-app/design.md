## Context

The target project is a new Feishu document assistant focused on synchronization instead of one-time export. The existing reference implementation at `F:\okzkx\feishu_docs_export` demonstrates a useful baseline architecture, but its workflow and data flow are optimized for Word export. This change introduces a sync-first architecture that continuously mirrors Feishu knowledge base content into local Markdown files and preserves synchronization state across runs.

Primary constraints:
- Source scope is limited to Feishu knowledge base documents.
- Document content must be retrieved through MCP-mediated Feishu API access.
- Output format is Markdown with stable local paths.
- Image handling must prefer remote links and fallback to local hashed assets.

Stakeholders include users who maintain local document repositories, developers integrating generated Markdown into downstream workflows, and operators who need reliable and observable synchronization behavior.

## Goals / Non-Goals

**Goals:**
- Provide reliable incremental sync of Feishu knowledge base documents to local Markdown.
- Establish a deterministic pipeline from remote document source to local file output.
- Offer a sync-centric interaction model (selection, status, run history, error feedback).
- Handle image references predictably with remote-first and local-fallback strategy.

**Non-Goals:**
- Supporting non-knowledge-base Feishu document types in this initial change.
- Exporting Word or other office formats.
- Building collaborative two-way editing back into Feishu in this phase.
- Solving long-term document semantic merge beyond deterministic overwrite/update rules.

## Decisions

1. **Scope source adapters to knowledge-base-only**
   - Decision: Build a dedicated source adapter that only discovers and syncs knowledge base document nodes.
   - Rationale: Reduces API surface area and ambiguity for MVP sync quality.
   - Alternative considered: Generalized Feishu doc source abstraction covering all container types; rejected for higher complexity and weaker delivery focus.

2. **Use MCP-backed content fetch and canonical Markdown generation**
   - Decision: Fetch structured document content through MCP Feishu integration and normalize into an internal intermediate representation before Markdown rendering.
   - Rationale: Keeps rendering deterministic and decouples API response shape from persisted Markdown.
   - Alternative considered: Direct API response to Markdown transformation without intermediate model; rejected due to brittle mapping and harder testing.

3. **Adopt manifest-driven incremental synchronization**
   - Decision: Maintain a local sync manifest (document IDs, source versions/update timestamps, output paths, hash metadata, last sync status) to drive differential sync.
   - Rationale: Enables fast no-op detection, partial retries, and auditability.
   - Alternative considered: Full re-sync every run; rejected due to unnecessary API/file churn and poor UX.

4. **Remote-first image strategy with hashed local fallback**
   - Decision: At render time, preserve remote image URLs when stable and accessible; otherwise download to a fixed assets folder with content-based hashed filenames and rewrite Markdown image links.
   - Rationale: Minimizes local storage duplication while guaranteeing offline or restricted-access fallback behavior.
   - Alternative considered: Always download all images locally; rejected for storage and sync time overhead.

5. **Sync-focused application state machine**
   - Decision: Implement explicit sync lifecycle states (`idle`, `preparing`, `syncing`, `partial-failed`, `completed`) surfaced in UI.
   - Rationale: Improves user trust and operational clarity versus opaque background operations.
   - Alternative considered: Minimal progress indicator only; rejected for insufficient troubleshooting support.

## Risks / Trade-offs

- **[Feishu API or MCP response variability]** -> Mitigation: Add schema validation and defensive transformation layers with explicit error classification.
- **[Remote image links may expire or be permission-bound]** -> Mitigation: Probe link viability and apply automatic fallback download + relink on failure.
- **[Large knowledge bases can cause long sync runs]** -> Mitigation: Support pagination, batch processing, and resumable manifest-based continuation.
- **[Local file collisions from renamed/moved documents]** -> Mitigation: Use stable document ID-based path keys internally and deterministic rename/update rules.
- **[Partial sync failures can leave mixed output state]** -> Mitigation: Track per-document status and rerunnable jobs; avoid global failure on single-node errors.

## Migration Plan

1. Initialize new project skeleton and baseline modules based on reference architecture patterns.
2. Implement knowledge-base discovery and sync manifest persistence.
3. Implement MCP fetch + intermediate model + Markdown renderer pipeline.
4. Add image resolution policy (remote-first with hashed local fallback).
5. Wire sync lifecycle and UI feedback states.
6. Run pilot sync against a controlled knowledge base, validate output structure and retry behavior.
7. Rollback strategy: keep sync output isolated under dedicated sync root; disabling sync feature returns app to non-destructive idle state without touching unrelated files.

## Open Questions

- Which Feishu fields are most reliable for incremental change detection (version, update_time, etag-like metadata)?
- Should the fixed image fallback directory be global per workspace or scoped per knowledge base?
- What conflict policy should apply when users manually edit generated Markdown files between sync runs?
- What authentication/session refresh model should be surfaced in UI for long-running sync jobs?
