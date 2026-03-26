## 1. Reference Path Analysis

- [x] 1.1 Trace the current connection validation flow and knowledge space enumeration flow in this app to identify where discovery is being blocked or misclassified.
- [x] 1.2 Compare the corresponding reference-project API or MCP calls, request parameters, and response handling used for successful knowledge space loading.
- [x] 1.3 Define the backend validation outcome model needed for `connected-with-spaces`, `connected-no-spaces`, `permission-denied`, `request-failed`, and `unexpected-response`.

## 2. Backend Validation And Discovery

- [x] 2.1 Refactor backend connection validation to rely on the authoritative knowledge space discovery path or a thin wrapper around it.
- [x] 2.2 Implement graceful degradation so non-authoritative preflight failures do not block discovery when authoritative loading can still run.
- [x] 2.3 Add structured classification and diagnostics for empty discovery, permission denial, request failure, and unexpected response cases.

## 3. Frontend Status And Empty-State Handling

- [x] 3.1 Update frontend connection-status handling to consume the new backend validation outcome model instead of a single generic failure state.
- [x] 3.2 Render distinct UI states for `connected-no-spaces`, `permission-denied`, and load failure, with retry or guidance actions for each.
- [x] 3.3 Ensure knowledge space lists are shown as empty only after authoritative successful discovery, not after failed loading.

## 4. Validation And Regression Coverage

- [x] 4.1 Add backend tests covering false-negative preflight regression, true permission denial, unexpected response, and request failure classification.
- [x] 4.2 Add frontend tests for trustworthy empty states and actionable error messaging tied to the classified outcomes.
- [ ] 4.3 Verify manually with the same Feishu app used by the reference project that accessible knowledge spaces now load correctly in this app.
