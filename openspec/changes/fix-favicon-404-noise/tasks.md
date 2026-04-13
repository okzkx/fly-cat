## 1. Static asset

- [x] 1.1 Add `public/favicon.ico` so `/favicon.ico` resolves in Vite dev and build output
- [x] 1.2 Add `<link rel="icon" href="/favicon.ico" />` to `index.html` for explicit document parity

## 2. Verification

- [x] 2.1 Run `openspec validate --change fix-favicon-404-noise`
- [x] 2.2 Run focused project checks (e.g. `pnpm test` or build) if they are fast and relevant
