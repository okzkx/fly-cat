## Context

The current sync application has crossed the threshold where backend sync behavior is real enough to expose operational quality problems in the UI. Users can now authenticate and load knowledge base roots, but the current sync workflow still hides the real output destination behind a relative string such as `./synced-docs`, generates task timestamps from debug-formatted `SystemTime`, and reports sync failures mostly as aggregate failed counts without enough stage-specific context to explain why a run failed.

This creates a trust problem in two places. First, users cannot confidently answer "where are my files supposed to be written?" because the displayed path is not normalized to a desktop-visible absolute location. Second, users cannot distinguish whether a failed run is caused by authorization, discovery, remote content fetch, image resolution, local filesystem writes, or other pipeline issues. The design therefore needs to tighten both path handling and failure observability without changing the overall sync-oriented shell or task model.

Primary constraints:
- The application remains a Tauri desktop app, so path normalization should be owned by the backend rather than guessed in frontend code.
- Existing task list and home page structure should remain recognizable; this is a quality and visibility change, not a navigation redesign.
- Failure reporting should remain concise at the top level but preserve enough structured detail for retries and debugging.
- The change should improve user-visible output location trust even when the configured sync root starts as a relative path.

Stakeholders include end users trying to locate generated Markdown, maintainers diagnosing repeated task failures, and developers who need stable backend/frontend contracts for timestamps, resolved paths, and failure categories.

## Goals / Non-Goals

**Goals:**
- Resolve configured sync roots into concrete backend-owned output paths and surface that resolved destination in the UI.
- Replace debug-style task timestamps and names with stable, user-readable values that render correctly in task history.
- Return actionable run-level and document-level failure diagnostics with pipeline-stage classification.
- Make task and home-page views trustworthy enough that users can tell whether sync output should exist locally and why a run failed if it does not.

**Non-Goals:**
- Redesign the whole task list into a different page model.
- Change the core authentication model or source-selection model again.
- Introduce full analytics or external telemetry infrastructure.
- Guarantee that every possible sync failure becomes auto-recoverable in this change.

## Decisions

1. **Normalize sync roots in the backend**
   - Decision: The Tauri backend will resolve configured sync roots to canonical absolute paths before task creation and return both the configured value and the resolved output path where needed.
   - Rationale: Only the backend has authoritative access to the desktop runtime's filesystem semantics, so it should decide where `./synced-docs` actually points.
   - Alternative considered: Resolve relative paths in frontend TypeScript; rejected because it is runtime-dependent and less trustworthy in Tauri.

2. **Use machine-stable timestamps and user-readable task names**
   - Decision: Task metadata should be stored in ISO-style timestamps and human-readable task names derived from real time formatting rather than `Debug` rendering of `SystemTime`.
   - Rationale: This fixes `Invalid Date` rendering and keeps task ordering/debugging stable across frontend and backend boundaries.
   - Alternative considered: Keep debug strings and parse them loosely in the UI; rejected because it preserves brittle formatting and invalid dates.

3. **Define a small sync failure stage taxonomy**
   - Decision: Sync failures will be classified into a bounded set of stages such as `auth`, `discovery`, `content-fetch`, `markdown-render`, `image-resolution`, and `filesystem-write`.
   - Rationale: Users need to understand which part of the pipeline failed without reading raw backend internals, and developers need stable categories for testing and display.
   - Alternative considered: Return only free-form error messages; rejected because it is hard to render consistently and weak for regression testing.

4. **Preserve both summary and per-item failure detail**
   - Decision: The task list should continue to show run-level counters, but backend task payloads must also preserve concise per-document diagnostics that the UI can expand or inspect.
   - Rationale: Aggregate counts alone are insufficient when all items fail; users need at least one clear failure reason tied to the affected document or stage.
   - Alternative considered: Replace the current summary UI entirely with verbose logs; rejected because it would overcomplicate the reference-style task view.

5. **Show resolved output location near sync creation and task history**
   - Decision: The UI should present the resolved sync destination both where users start a sync and where they inspect prior tasks, rather than only storing it invisibly in backend state.
   - Rationale: Users asking "where is the sync directory?" need the answer in both the moment of configuration and the moment of troubleshooting.
   - Alternative considered: Show the path only on the settings page; rejected because task troubleshooting happens later and may involve a resolved path different from the raw setting.

## Risks / Trade-offs

- **[Path normalization may expose unexpected working-directory behavior]** -> Mitigation: centralize path resolution in backend code and surface the final resolved path explicitly in UI.
- **[More detailed failure payloads can clutter the task view]** -> Mitigation: keep top-level summaries concise and expose detail progressively.
- **[Failure stage classification may initially misbucket some errors]** -> Mitigation: use a small stable taxonomy plus raw diagnostic text fallback.
- **[Changing task timestamp format may affect existing stored tasks]** -> Mitigation: preserve backward-tolerant UI handling where possible and normalize new writes immediately.

## Migration Plan

1. Replace task timestamp generation and task naming in the backend with stable, parseable values.
2. Add backend sync-root normalization helpers and ensure task creation stores resolved output paths.
3. Add or refine sync failure stage classification at pipeline boundaries and propagate structured diagnostics through task payloads.
4. Update home-page and task-list UI to display resolved output paths and failure details clearly.
5. Validate with both successful and failing sync runs, including the existing "all failed" scenario from current user feedback.
6. Rollback strategy: if new diagnostics or path normalization cause regressions, keep the previous task payload shape temporarily while retaining the new timestamps and resolved-path helpers behind the backend boundary.

## Open Questions

- Should the UI expose a one-click "open sync folder" action in this same change or defer it to a follow-up?
- How many failed-item details should the task list show inline before collapsing behind an expand action?
- Should existing stored tasks with invalid timestamps be migrated, or only new tasks be normalized going forward?
