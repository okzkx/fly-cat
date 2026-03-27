## 1. Reference Auth Flow Alignment

- [x] 1.1 Trace the reference project's user-login flow, callback handling, persisted auth state, and refresh behavior that this app must mirror.
- [x] 1.2 Define the signed-in user/session data model and storage layout for this Tauri app, separate from existing app settings.
- [x] 1.3 Replace the current app-only authorization assumptions in the bootstrap and connection flow with an explicit signed-out vs signed-in state model.

## 2. Backend Session Runtime

- [x] 2.1 Implement backend-owned user session persistence and bootstrap restoration in `src-tauri`.
- [x] 2.2 Add backend commands/services for starting user authorization, handling callback completion, and signing out.
- [x] 2.3 Implement refresh-aware user-authorized Feishu client access for knowledge base discovery and document operations.
- [x] 2.4 Return explicit authorization classifications such as `not-signed-in`, `session-expired`, `permission-denied`, and `reauthorization-required`.

## 3. Frontend Auth And Shell Flow

- [x] 3.1 Update settings, auth, and bootstrap state handling so valid app config does not bypass required user sign-in.
- [x] 3.2 Rework the auth page to follow the reference-style user login and reauthorization flow instead of direct tenant-token validation.
- [x] 3.3 Update the app shell/header to show signed-in user context plus sign-out or reauthorization entry points consistent with the reference project.
- [x] 3.4 Update home-page gating and navigation so only a valid signed-in user session can enter knowledge base selection and sync creation.

## 4. Sync Authorization Integration

- [x] 4.1 Refactor knowledge base loading, selected-space discovery, and sync task creation to require the current signed-in user session.
- [x] 4.2 Ensure sync execution and resume paths use the same user-authorized backend client rather than falling back to app-only credentials.
- [x] 4.3 Detect mid-run session expiry or revocation and surface auth-specific task failure or retry states.

## 5. Validation And Regression Coverage

- [x] 5.1 Add tests for bootstrap restoration, signed-out gating, expired-session classification, and permission-denied handling.
- [x] 5.2 Add tests for sync-start rejection and mid-run auth failure behavior when no valid user session exists.
- [x] 5.3 Verify manually that the same account and flow used by the reference project can sign in here, load accessible knowledge bases, and start sync successfully.
