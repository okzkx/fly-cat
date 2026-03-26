## Why

The current app still validates and accesses Feishu knowledge bases through application-level credentials, which diverges from the reference project and makes whole-knowledge-base operations harder to perform under real user permissions. We need to align this app with the reference project's user-authorized login model now so knowledge base discovery, sync planning, and document access all run with the same effective permissions users expect.

## What Changes

- Replace the current application-credential connection flow with a user-authorized Feishu login flow that follows the reference project's implementation pattern.
- Use user-granted access, rather than app-only tenant access, as the authoritative permission path for knowledge base discovery, selection, and synchronization.
- Persist and refresh user session state in the desktop runtime so the app can continue to access the full set of knowledge base operations available to the signed-in user.
- Update settings, auth, and home-page behavior to guide users through the same reference-style login and reauthorization flow instead of direct tenant-token validation.
- Reclassify connection and space-loading outcomes around user authorization state, expired sessions, and permission gaps so users can recover without guessing whether the issue is app config or account access.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `knowledge-base-source-sync`: change discovery and sync access requirements so knowledge base operations use the signed-in user's effective permissions rather than app-only tenant credentials.
- `sync-focused-application-experience`: change configuration, authorization, and recovery flows to use a dedicated user-login experience aligned with the reference project.
- `reference-app-shell-alignment`: tighten parity requirements so the authorization path, page rhythm, and signed-in session behavior follow the reference project's user-auth pattern.
- `tauri-desktop-runtime-and-backend`: change backend runtime requirements to support desktop user-session persistence, token refresh, and user-authorized API calls for sync operations.

## Impact

- Affects frontend settings, auth, bootstrap, and home-page flows that currently assume direct app-secret-based validation.
- Affects Tauri/Rust commands, persisted auth state, and Feishu API access paths that currently rely on `tenant_access_token`.
- Affects knowledge base enumeration, sync execution, and error classification because these must now honor user session state and user-specific permissions.
- Requires OpenSpec requirement updates for auth/session behavior, runtime responsibilities, and user-facing recovery states before implementation starts.
