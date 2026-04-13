## Why

Browsers request `/favicon.ico` by default. The Vite dev server had no file at that path, producing HTTP 404 and console noise during local runs and smoke tests.

## What Changes

- Add a static `favicon.ico` under `public/` so Vite serves it at `/favicon.ico`.
- Optionally declare the icon in `index.html` for explicit parity with common SPA setups.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `reference-app-shell-alignment`: Clarify that the app shell includes a valid favicon served at the conventional path so development tooling and browsers do not hit spurious 404s.

## Impact

- `public/favicon.ico` (new)
- `index.html` (optional `<link rel="icon">`)
