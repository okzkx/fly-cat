## Context

The current repository has already moved away from mock login, but its effective access model is still application-oriented: the frontend asks the backend to validate the Feishu connection, and the backend currently derives access from app credentials and `tenant_access_token`-based OpenAPI calls. That is sufficient for coarse connectivity checks, but it does not match the reference project's user-authorized model and creates a mismatch between what the app can technically connect to and what the signed-in operator should be allowed to browse or synchronize across the full knowledge base.

This change is cross-cutting because it affects desktop authentication flow, persisted runtime state, backend API clients, bootstrap semantics, error handling, and the UX contract between settings, auth, and home pages. The design therefore needs to replace "app config implies access" with "signed-in user session authorizes access" while still preserving the reference project's shell, page rhythm, and long-running desktop sync model.

Primary constraints:
- The login and session model should follow the reference project's implementation pattern rather than inventing a new auth UX.
- The app remains a Tauri desktop app, so browser-only session assumptions are not sufficient.
- Knowledge base discovery and sync must execute with the same effective permissions path to avoid false-positive access during validation.
- Existing app configuration still matters for endpoint and application registration, but it is no longer the sole authority for knowledge base access.

Stakeholders include end users who need to operate on all knowledge bases they personally can access, maintainers comparing this project with the reference project, and developers who must keep frontend/backend auth state consistent during sync runs and app restart.

## Goals / Non-Goals

**Goals:**
- Align desktop login, authorization, and session persistence with the reference project's user-permission model.
- Ensure knowledge space discovery, document enumeration, and sync execution use the same signed-in user context.
- Persist enough auth state to restore a valid signed-in session across app restarts and refresh it when possible.
- Surface clear user-facing states for not signed in, session expired, permission denied, and reauthorization required.
- Preserve the existing reference-style page flow of settings -> auth -> home -> task list while changing the underlying access model.

**Non-Goals:**
- Redesign the app into a different shell or navigation model.
- Add support for non-knowledge-base Feishu content.
- Finalize every implementation detail of Feishu OAuth beyond what is needed to mirror the reference project's working desktop pattern.
- Introduce multi-account session switching or enterprise-grade auth administration features in this change.

## Decisions

1. **Make user session the authoritative access boundary**
   - Decision: Knowledge base discovery, selected-space loading, document fetch, and sync execution will all require a signed-in user session, and app credentials alone will no longer be treated as proof of knowledge base access.
   - Rationale: The user's request is explicit that whole-knowledge-base operations should follow the reference project's user-permission path. Using one authoritative permission boundary avoids mismatches between validation and real sync behavior.
   - Alternative considered: Keep app-level validation for discovery and use user auth only for some downstream operations; rejected because it preserves split-brain access rules and confusing onboarding.

2. **Reuse the reference project's desktop login transport and callback pattern**
   - Decision: The Tauri app will follow the same overall login initiation, callback handling, and success/failure state transitions as the reference project, adapting only names and sync-specific copy where required.
   - Rationale: This reduces architecture drift and keeps user expectations aligned across the two projects.
   - Alternative considered: Build a simpler custom auth dialog or manual token-entry flow; rejected because it would diverge from the reference implementation and create more maintenance surface.

3. **Persist structured auth session state in the backend**
   - Decision: The Rust/Tauri backend will store the signed-in user's session metadata and refreshable credential state in app data, and expose bootstrap/status commands that distinguish configured app settings from active user authorization.
   - Rationale: The desktop app must survive restart, background sync, and temporary UI refresh without losing the user's access context.
   - Alternative considered: Keep session state only in frontend memory or browser storage; rejected because it is not robust in a Tauri desktop runtime and breaks long-running workflows.

4. **Split app configuration validity from user authorization validity**
   - Decision: The system will model app setup and user sign-in as separate but related states: settings can be valid while the user is signed out, expired, or missing permission grants.
   - Rationale: This creates clearer recovery flows and avoids collapsing "config is correct" and "user is authorized" into one ambiguous validation result.
   - Alternative considered: Continue returning a single generic connection status; rejected because it hides whether the next action should be edit settings, sign in again, or request more permissions.

5. **Route all Feishu knowledge-base API access through a user-authorized client abstraction**
   - Decision: Backend Feishu access code will be refactored so knowledge-base listing, node traversal, and document fetch operate through a user-session-aware client abstraction, with token refresh or reauth checks at the client boundary.
   - Rationale: This keeps authorization logic centralized and prevents some operations from accidentally falling back to app-only credentials.
   - Alternative considered: Patch each API call site independently to attach user tokens; rejected because it is brittle and makes regression likely.

6. **Classify authorization failures as first-class runtime outcomes**
   - Decision: Bootstrap, connection checks, and sync execution will explicitly classify states such as `not-signed-in`, `session-expired`, `permission-denied`, and `reauthorization-required`, in addition to transport or response errors.
   - Rationale: User-auth-based access introduces session lifecycle failure modes that the current app does not communicate clearly.
   - Alternative considered: Reuse existing generic request failure states; rejected because it would obscure the new auth model and make recovery harder.

7. **Require sync tasks to fail safely when user authorization becomes invalid mid-run**
   - Decision: Long-running sync jobs will detect expired or revoked user sessions, stop or partially fail with explicit auth-related diagnostics, and offer retry after reauthorization rather than continuing with stale assumptions.
   - Rationale: Desktop sync may outlive the freshness of a user session, so auth drift must be visible and recoverable.
   - Alternative considered: Assume the session remains valid for the entire run; rejected because it is unsafe for long-running or resumable work.

## Risks / Trade-offs

- **[Desktop user auth adds session lifecycle complexity]** -> Mitigation: centralize token handling and state classification in backend-owned auth/session services.
- **[Reference-project parity may depend on hidden implementation details]** -> Mitigation: explicitly mirror the reference flow and keep any intentional deviations documented in specs and implementation notes.
- **[Persisted credentials increase local security sensitivity]** -> Mitigation: store only required session material, scope it to app data, and keep session lifecycle management in the backend rather than the frontend.
- **[Long-running sync can encounter mid-run session expiry]** -> Mitigation: treat auth expiry as a first-class retryable failure and preserve partial progress/task visibility.
- **[Separating settings validity from sign-in state expands UI state space]** -> Mitigation: keep the state model explicit and reference-style so each page has one clear next action.

## Migration Plan

1. Map the reference project's user-login flow, callback handling, persisted auth state, and refresh behavior onto this repository's Tauri structure.
2. Introduce a backend-owned auth/session model that stores signed-in user information separately from app settings.
3. Replace current `tenant_access_token`-authoritative discovery and sync access with user-session-authoritative clients and commands.
4. Update frontend bootstrap and page transitions so settings, auth, home, and task pages react to both configuration status and sign-in/session status.
5. Add auth-aware retry/error handling for connection checks, knowledge space loading, and sync tasks.
6. Rollback strategy: if the user-auth path proves nonfunctional, revert the new session-gated access path while preserving the prior app-config flow until parity issues are resolved.

## Open Questions

- Which exact reference-project callback and token-refresh mechanics should be mirrored verbatim, and which can remain implementation-private?
- Does the first implementation need silent refresh, or is explicit re-login acceptable when refresh is unavailable?
- What minimal signed-in user profile data should be persisted and shown in the shell/header?
- Should background/resumed sync tasks always require a fresh session check before restarting document fetches?
