## Context

Vite serves files from `public/` at the site root. The project had no `public/favicon.ico`, so default browser requests returned 404 and cluttered devtools.

## Goals / Non-Goals

**Goals:**

- Serve a valid icon at `/favicon.ico` in dev and production builds.
- Keep the asset minimal and brand-neutral unless a dedicated FlyCat icon asset already exists (none in repo).

**Non-Goals:**

- Full brand iconography refresh or multi-size ICO sprits.
- Changing Tauri window icons (separate packaging path).

## Decisions

- **Use `public/favicon.ico`**: Matches Vite defaults and silences implicit `/favicon.ico` fetches without extra server config.
- **Tiny placeholder ICO**: A minimal valid file keeps the change self-contained and avoids new build tooling.

## Risks / Trade-offs

- **Placeholder look** → Acceptable; task scope is removing 404 noise, not final art direction.
