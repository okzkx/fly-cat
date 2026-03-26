## Context

The target project is a new Feishu document assistant focused on synchronization instead of one-time export. The existing reference implementation at `F:\okzkx\feishu_docs_export` is not just a loose architectural inspiration; it is the product and engineering baseline that this project should largely follow. This means the new app should preserve the same desktop shell style, the same major page decomposition (`SettingsPage`, `AuthPage`, `HomePage`, `TaskListPage` style flows), the same Ant Design + Tauri interaction model, the same Rust backend split, and the same event-driven task update pattern wherever sync requirements do not require divergence.

The current repository contains a web-first prototype and some isolated sync-domain services, but that prototype is not sufficient to satisfy the intended architecture because it does not yet provide a real `src-tauri` runtime, Rust-side commands, plugin wiring, or native desktop execution. The plan therefore needs to explicitly treat the current frontend prototype as transitional and migrate the app onto a proper Tauri structure.

This change therefore introduces a sync-first architecture that continuously mirrors Feishu knowledge base content into local Markdown files and preserves synchronization state across runs, while intentionally staying close to the reference app's UX structure and code framework.

Primary constraints:
- Source scope is limited to Feishu knowledge base documents.
- Document content must be retrieved through MCP-mediated Feishu API access.
- Output format is Markdown with stable local paths.
- Image handling must prefer remote links and fallback to local hashed assets.
- The implementation target is a real Tauri desktop app, not a browser-only SPA.

Stakeholders include users who maintain local document repositories, developers integrating generated Markdown into downstream workflows, and operators who need reliable and observable synchronization behavior.

## Goals / Non-Goals

**Goals:**
- Provide reliable incremental sync of Feishu knowledge base documents to local Markdown.
- Establish a deterministic pipeline from remote document source to local file output.
- Offer a sync-centric interaction model (selection, status, run history, error feedback).
- Keep the app shell, page hierarchy, component boundaries, and desktop interaction conventions highly aligned with the reference project.
- Reuse the reference project's proven configuration/auth/task-management patterns, adapting them from export semantics to sync semantics.
- Handle image references predictably with remote-first and local-fallback strategy.
- Move sync orchestration, filesystem writes, and long-running task management into Rust/Tauri backend responsibilities.

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

6. **Mirror the reference app shell and page structure**
   - Decision: Use the reference project's `settings -> auth -> home -> task list` navigation rhythm, header layout, user-menu placement, and page decomposition as the default structure for the new project.
   - Rationale: The reference app already embodies the desired desktop product feel; reusing its shell reduces product drift and implementation ambiguity.
   - Alternative considered: Designing a new simplified single-page shell; rejected because it diverges from the requested product baseline and loses proven interaction patterns.

7. **Reuse the reference task/event architecture with renamed sync semantics**
   - Decision: Keep a task-centric runtime model similar to the reference project's download/export task system, but reinterpret it as sync tasks with progress, retry, resume, and status events.
   - Rationale: Synchronization is still a long-running desktop workflow and benefits from the same observable task orchestration model.
   - Alternative considered: A stateless "click once and wait" sync action; rejected because it weakens recoverability, observability, and parity with the reference implementation.

8. **Stay on the same primary frontend/backend stack unless sync logic demands otherwise**
   - Decision: The intended implementation stack remains Tauri + React + Ant Design on the frontend with a Tauri backend/event model, matching the reference app as closely as practical.
   - Rationale: The user's requirement is explicit that code framework should mostly follow the sample project.
   - Alternative considered: Replacing the stack with a lighter pure-web scaffold; rejected because it conflicts with the reference-driven requirement.

9. **Push native responsibilities into Rust backend**
   - Decision: MCP access, sync execution, manifest persistence, image fallback download, and filesystem mutations should be implemented as Rust-side commands/services exposed to the frontend through Tauri `invoke` and event channels.
   - Rationale: These are native, long-running, and file-heavy responsibilities that match the reference project's backend split and are better suited to Tauri backend execution than browser code.
   - Alternative considered: Keeping these responsibilities in frontend TypeScript with browser APIs or mock local storage; rejected because it is not a real desktop architecture and does not match the reference project.

10. **Adopt reference-style Tauri plugin and config baseline**
   - Decision: Recreate `src-tauri/Cargo.toml`, `tauri.conf.json`, and plugin wiring from the reference project as the baseline, then adjust names, permissions, and sync-specific plugins/commands as needed.
   - Rationale: This minimizes architectural drift and provides the correct `npm run tauri dev` workflow from the start.
   - Alternative considered: Incrementally adding Tauri later after a web prototype stabilizes; rejected because it encourages the wrong runtime split and causes rework.

## Risks / Trade-offs

- **[Feishu API or MCP response variability]** -> Mitigation: Add schema validation and defensive transformation layers with explicit error classification.
- **[Remote image links may expire or be permission-bound]** -> Mitigation: Probe link viability and apply automatic fallback download + relink on failure.
- **[Large knowledge bases can cause long sync runs]** -> Mitigation: Support pagination, batch processing, and resumable manifest-based continuation.
- **[Local file collisions from renamed/moved documents]** -> Mitigation: Use stable document ID-based path keys internally and deterministic rename/update rules.
- **[Partial sync failures can leave mixed output state]** -> Mitigation: Track per-document status and rerunnable jobs; avoid global failure on single-node errors.
- **[Over-simplifying the shell can drift away from the sample project]** -> Mitigation: Treat reference page structure and component boundaries as a design constraint, not merely a suggestion.
- **[Directly copying export UX can confuse sync semantics]** -> Mitigation: Preserve structure and interaction rhythm while renaming controls, statuses, and task meanings to explicitly reflect synchronization.
- **[A web-only prototype may harden into the wrong architecture]** -> Mitigation: Explicitly plan a Tauri migration layer now and move native responsibilities behind Rust commands before feature completion.
- **[Frontend/backend contracts may churn during migration]** -> Mitigation: Define clear command/event interfaces early and keep frontend state management thin.

## Migration Plan

1. Establish the real Tauri project structure by porting the reference project's desktop/runtime baseline (`src-tauri`, config, plugins, scripts) into the new repository.
2. Recreate the reference project's desktop shell, top-level page composition, and shared layout conventions in the frontend.
3. Replace export-specific backend logic with knowledge-base sync discovery, manifest persistence, MCP fetch, Markdown generation, and sync task orchestration in Rust/Tauri services.
4. Add image resolution policy (remote-first with hashed local fallback) as a backend-owned pipeline.
5. Restore task/event-driven runtime behaviors through Tauri events and command boundaries, then rename/adapt UI copy and semantics for sync.
6. Run pilot sync against a controlled knowledge base, validate output structure and retry behavior.
7. Rollback strategy: keep sync output isolated under dedicated sync root; disabling sync feature returns app to non-destructive idle state without touching unrelated files.

## Open Questions

- Which Feishu fields are most reliable for incremental change detection (version, update_time, etag-like metadata)?
- Should the fixed image fallback directory be global per workspace or scoped per knowledge base?
- What conflict policy should apply when users manually edit generated Markdown files between sync runs?
- What authentication/session refresh model should be surfaced in UI for long-running sync jobs?
- Which specific reference-project modules should remain nearly identical in structure, and which are acceptable to redesign for sync?
- Should the first Tauri cut keep SQLite/task persistence from the reference project, or defer durable task DB until after the basic sync flow is end-to-end?
