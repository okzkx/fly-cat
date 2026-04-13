## ADDED Requirements

### Requirement: Conventional favicon is served

The application MUST expose a valid favicon at the conventional URL path `/favicon.ico` in the Vite-powered web client so browsers and automated tooling do not receive `404` for the default favicon request during local development and production static hosting.

#### Scenario: Default favicon request succeeds

- **WHEN** a client issues `GET /favicon.ico` against the dev server or the built static assets root
- **THEN** the response status is not `404` and the body is a valid favicon payload (ICO or equivalent served with appropriate content)

#### Scenario: Document may link the icon explicitly

- **WHEN** the root HTML document is loaded
- **THEN** it MAY include a `<link rel="icon" href="/favicon.ico">` (or equivalent) pointing at the same static asset for explicit parity with common SPA setups
