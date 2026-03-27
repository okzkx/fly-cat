## Context

The project has already adopted the FlyCat / 飞猫助手 name in repository-facing documentation, but the in-app experience still contains inconsistent branding such as "Feishu sync" wording in titles, headers, or related shell labels. This is a cross-cutting presentation problem because users experience the product name through multiple surfaces: the top-level shell, page headings, logo or icon treatment, and task-oriented views.

The requested change is intentionally narrow in scope: unify visible in-app branding without redefining how synchronization terminology itself works. The design therefore needs to distinguish product identity ("FlyCat / 飞猫助手") from functional language ("sync", "knowledge base", "task", and similar workflow terms) so the UI becomes more consistent without becoming less descriptive.

Primary constraints:
- The app should retain its current page flow and shell structure; this is a branding alignment change, not a navigation redesign.
- Branding should be consistent across shell and pages, but not every technical label must be rewritten if it describes real sync behavior rather than product identity.
- The change should favor one canonical product identity so future UI work does not reintroduce mixed naming.

## Goals / Non-Goals

**Goals:**
- Present a consistent top-level application identity as FlyCat / 飞猫助手.
- Replace outdated product-brand wording such as "飞书同步xxx" when it is functioning as branding rather than feature description.
- Keep page titles, shell labels, and visible logo/brand marks aligned with the FlyCat brand.
- Preserve clear functional sync terminology where it helps users understand the workflow.

**Non-Goals:**
- Rename internal code symbols, package names, or historical archive entries unless needed for visible product output.
- Redesign the visual system beyond the minimal logo/title updates needed for brand consistency.
- Reword every sync-related phrase in the app if it is a feature description rather than a product name.

## Decisions

1. **Use one canonical bilingual brand form**
   - Decision: The product identity should be represented as `飞猫助手` with optional secondary English `FlyCat` where the UI already supports a subtitle or compact bilingual presentation.
   - Rationale: This keeps the Chinese-first branding explicit while preserving continuity with existing README and project-facing material.
   - Alternative considered: Use only `FlyCat`; rejected because the request explicitly centers `飞猫助手` and the current UI is Chinese-first.

2. **Treat shell branding as the source of truth**
   - Decision: Header title, logo/brand mark, and other shell-level identity cues should define the canonical product name that page-level views follow.
   - Rationale: Users derive their first impression of the product from the shell; if the shell is correct, secondary views can align around it more reliably.
   - Alternative considered: Update individual pages independently; rejected because it risks leaving mixed branding in shared chrome.

3. **Separate product branding from workflow wording**
   - Decision: Replace outdated app-name-like strings with FlyCat branding, but preserve explicit sync/task terminology where it describes behavior rather than identity.
   - Rationale: This avoids over-editing the UI into vague marketing language and keeps the workflow understandable.
   - Alternative considered: Replace all sync wording with FlyCat branding; rejected because it would reduce clarity in task and workflow contexts.

4. **Prefer lightweight asset changes**
   - Decision: If a visible logo exists, update it through the simplest compatible asset or component change instead of introducing a broader icon system redesign.
   - Rationale: The requirement is brand consistency, not a visual identity overhaul.
   - Alternative considered: Redesign the full logo/icon set; rejected as out of scope.

## Risks / Trade-offs

- **[Some legacy labels may look like branding but actually describe behavior]** -> Mitigation: apply the product-vs-workflow distinction consistently during implementation.
- **[Bilingual branding can become visually noisy in compact spaces]** -> Mitigation: keep `飞猫助手` primary and use `FlyCat` only where layout already supports it.
- **[Brand updates may miss low-visibility surfaces such as task titles or empty states]** -> Mitigation: include shell, page, and task surfaces explicitly in implementation tasks.

## Migration Plan

1. Identify visible app-brand surfaces in the shell, page titles, task views, and logo/brand mark rendering.
2. Replace legacy product wording with FlyCat / 飞猫助手 according to the shell-first branding rule.
3. Validate that workflow terms remain descriptive where needed.
4. Manually review the main app flow to confirm branding consistency across settings, auth, home, and task views.

## Open Questions

- Should the visible shell title use only `飞猫助手`, or `飞猫助手 FlyCat`, in the narrowest header layout?
- Does the current app logo need a new asset, or is a text/emoji/icon-based brand mark sufficient for this change?
