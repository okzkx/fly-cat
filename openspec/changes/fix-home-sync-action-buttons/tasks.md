## 1. Layout fix

- [ ] 1.1 Add a stable `className` (for example `home-kb-sync-card`) to the primary knowledge-base `Card` in `src/components/HomePage.tsx`.
- [ ] 1.2 In `src/styles.css`, add scoped rules so `.home-kb-sync-card .ant-card-head-wrapper` uses a column flex direction, stretches children, and keeps a small vertical gap so the `extra` action row sits below the title row without horizontal overflow clipping.

## 2. Validation

- [ ] 2.1 Run `pnpm run typecheck` (or project equivalent) and `pnpm run build` on touched files.
