## Context

The desktop app already uses `@tauri-apps/plugin-opener` for both folder-opening and OAuth browser launch flows. The document browser action currently builds the correct Feishu URL, but it routes that URL through the local-path opener helper, which is not the right API for external browser navigation.

## Goals / Non-Goals

**Goals:**
- Use the correct opener helper for external document URLs in the desktop runtime.
- Preserve the existing return shape so callers can handle success or failure consistently.
- Show a user-visible error when opening the browser fails.

**Non-Goals:**
- Redesign the knowledge tree UI.
- Change workspace-folder opening behavior.
- Add new backend commands or permissions unless the existing opener path proves insufficient.

## Decisions

- Use `openUrl(...)` for document and bitable browser actions because the auth flow already relies on it successfully for Feishu OAuth pages.
- Keep URL construction in `openDocumentInBrowser(...)` so the HomePage button remains a thin caller.
- Handle unsuccessful results in `HomePage` with contextual error messaging instead of logging only in the helper.

## Risks / Trade-offs

- [Opener plugin behavior varies by platform] -> Reuse the same API already used by authorization browser launch to minimize platform-specific surprises.
- [UI messages could become noisy] -> Only show an error when the helper explicitly reports failure or throws.
