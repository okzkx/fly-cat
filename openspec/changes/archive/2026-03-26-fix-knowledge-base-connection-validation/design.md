## Context

The current app can report `连接校验失败` and show an empty knowledge base list even when the Feishu app configuration is valid in practice and the same app can enumerate knowledge spaces in the reference project. This indicates that the validation path in this repository is likely stricter, earlier, or semantically different from the path that actually succeeds during reference-project discovery.

This is a cross-cutting issue because it affects backend connection checks, knowledge space enumeration, frontend status mapping, and the user-facing empty/error states. The design therefore needs to make validation behavior consistent with real sync access, while preserving fast feedback when configuration is truly invalid.

Stakeholders include end users configuring the app for the first time, developers comparing behavior against the reference project, and maintainers diagnosing Feishu or MCP permission mismatches.

## Goals / Non-Goals

**Goals:**
- Make knowledge space discovery succeed whenever the effective Feishu/MCP access path is valid, even if a narrower preflight check is unavailable or returns a non-authoritative failure.
- Separate validation outcomes into actionable categories instead of collapsing them into a single generic connection error.
- Align this app's discovery and validation behavior with the reference project's proven path closely enough that the same app configuration behaves consistently across both projects.
- Preserve observability so maintainers can tell whether the failure comes from permissions, response shape, endpoint mismatch, or a true transport/auth problem.

**Non-Goals:**
- Redesign the full authentication model or Feishu app onboarding flow.
- Expand source support beyond knowledge base spaces.
- Solve every Feishu permission edge case for unrelated document APIs.
- Add heavyweight telemetry infrastructure beyond targeted logs and structured error classification.

## Decisions

1. **Use discovery-path validation instead of a separate hard gate**
   - Decision: Connection validation will use the same backend capability chain as knowledge space discovery, or a very thin wrapper around it, instead of depending on an earlier and potentially incompatible preflight check.
   - Rationale: A connection check that rejects configurations which can actually enumerate spaces is not authoritative and produces false negatives.
   - Alternative considered: Keep the existing preflight check and only tweak error copy; rejected because it preserves the core mismatch and continues hiding valid downstream access.

2. **Treat validation as classified outcome, not binary success/failure**
   - Decision: The backend will return structured validation outcomes such as `connected-with-spaces`, `connected-no-spaces`, `permission-denied`, `request-failed`, and `unexpected-response`.
   - Rationale: The current generic failure message prevents users and developers from distinguishing permission problems from empty membership or integration bugs.
   - Alternative considered: Return only success/failure plus raw message text; rejected because it makes UI logic brittle and inconsistent.

3. **Allow graceful degradation from validation into discovery**
   - Decision: When a non-authoritative validation step fails but downstream discovery can still run safely, the system should attempt discovery and classify the result from the authoritative response.
   - Rationale: For this issue, the most likely defect is an overly strict validation assumption, so graceful degradation avoids blocking users on false negatives.
   - Alternative considered: Abort immediately on any validation exception; rejected because it reproduces the current broken behavior.

4. **Define explicit empty-state semantics**
   - Decision: The frontend will distinguish `no joined knowledge spaces` from `failed to load knowledge spaces`, and will only show the former when the backend has completed an authoritative discovery attempt without errors.
   - Rationale: An empty list caused by an error must not be presented as a normal empty state.
   - Alternative considered: Continue using a single empty list state with toast errors; rejected because it is easy to misread and hard to debug.

5. **Add reference-comparison diagnostics**
   - Decision: Backend validation and discovery logs should record which API path was attempted, what classification was produced, and enough response-shape context to compare behavior against the reference project without exposing secrets.
   - Rationale: This defect specifically involves divergence from a known-good reference implementation, so comparison-friendly diagnostics reduce repeated guesswork.
   - Alternative considered: Rely on ad hoc local debugging; rejected because it slows investigation and makes regressions harder to confirm.

## Risks / Trade-offs

- **[Graceful degradation could mask a genuinely broken preflight check]** -> Mitigation: keep structured classification and logs so non-authoritative validation failures remain visible even when discovery succeeds.
- **[Different Feishu tenants may expose slightly different response shapes]** -> Mitigation: validate only required fields, classify malformed responses explicitly, and avoid coupling UI decisions to raw payload details.
- **[Reference-project parity may still be incomplete if it uses additional hidden assumptions]** -> Mitigation: log endpoint and classification details so any remaining mismatch can be compared concretely.
- **[More detailed error states increase frontend/backend contract surface]** -> Mitigation: keep the outcome enum small and stable, with a fallback `unexpected-response` bucket.

## Migration Plan

1. Trace the current connection validation path and knowledge space enumeration path, then identify where behavior diverges from the reference project.
2. Refactor backend validation so authoritative discovery drives the final connection result classification.
3. Update frontend state handling to render classified outcomes, including true empty-state messaging and retry guidance.
4. Add tests for valid-access false-negative regression, no-space empty state, permission-denied state, and transport/response failures.
5. Verify that the same app configuration used in the reference project now loads the expected knowledge spaces in this app.
6. Rollback strategy: revert to the prior validation gate if the new classification path introduces broader discovery failures, while keeping added logs to continue diagnosis.

## Open Questions

- Which exact API or MCP method differs between this app and the reference project during knowledge space loading?
- Should `connected-no-spaces` be considered a successful validation state or a warning state in the UI?
- Is there any Feishu tenant configuration where knowledge base discovery requires a different permission probe than document content retrieval?
- How much raw response context can be safely logged without leaking tenant-specific identifiers?
