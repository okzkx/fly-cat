## Why

The knowledge tree already exposes a "在浏览器打开" action for documents and bitables, but the current desktop runtime path does not reliably launch the default browser for Feishu URLs. Users click the action and see no visible effect, which makes the shortcut untrustworthy.

## What Changes

- Switch the desktop document-opening helper to use the URL-opening API that is intended for browser navigation.
- Return launch failures to the caller so the UI can show an error instead of silently doing nothing.
- Keep the existing workspace-folder opener behavior unchanged.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `tauri-desktop-runtime-and-backend`: Document and bitable browser actions must launch the system browser through the correct opener path and report failures back to the frontend.

## Impact

- Affected code: `src/utils/tauriRuntime.ts`, `src/components/HomePage.tsx`
- Runtime/API surface: Tauri opener plugin usage for external URLs
- User experience: browser-launch failures become visible instead of silent
