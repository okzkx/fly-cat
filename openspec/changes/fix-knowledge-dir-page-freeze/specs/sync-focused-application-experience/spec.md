## ADDED Requirements

### Requirement: Non-Blocking Page Transitions After Bootstrap Calls
The application MUST perform page navigation immediately when the user saves settings or completes authorization, without waiting for the `getAppBootstrap` call to return, so that the UI does not freeze during the bootstrap network round-trip.

#### Scenario: Settings save transitions to auth page without delay
- **WHEN** the user saves settings on the SettingsPage
- **THEN** the application transitions to the auth page immediately
- **AND** bootstrap data such as `resolvedSyncRoot` is loaded asynchronously after the page transition

#### Scenario: Authorization success transitions to home page without delay
- **WHEN** the user completes Feishu authorization on the AuthPage
- **THEN** the application transitions to the home page immediately using data already returned from `completeUserAuthorization`
- **AND** supplementary bootstrap data such as `resolvedSyncRoot` is loaded asynchronously after the page transition
