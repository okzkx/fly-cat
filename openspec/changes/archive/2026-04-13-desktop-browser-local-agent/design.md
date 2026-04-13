## Context

The current application has one real runtime and one fake runtime. Desktop mode uses Tauri commands plus Rust-side persistence for settings, user sessions, tasks, preview reads, and sync metadata. Browser mode bypasses that stack entirely and substitutes `localStorage`, seeded spaces, simulated auth, and timer-driven task progress.

That split creates two problems:

1. the browser cannot validate the real same-machine experience
2. frontend pages now mix host detection with business behavior

This MVP keeps the desktop process as the host of truth, then lets a browser on the same machine talk to it through a loopback HTTP agent instead of through Tauri IPC.

## Goals / Non-Goals

**Goals:**
- Start a localhost-only agent automatically with the desktop process
- Let browser sessions load real bootstrap, settings, auth, spaces, tasks, and sync metadata from the same local persisted state used by desktop mode
- Remove the default browser mock path from product behavior
- Keep desktop event-driven behavior intact while giving browser mode a polling-based task bridge
- Reduce business-level `isTauriRuntime()` branching in app pages

**Non-Goals:**
- Remote multi-machine access to a user's desktop data
- Sidecar extraction or keeping the agent alive after the desktop process exits
- Full Rust service-layer extraction out of `commands.rs` in this same slice
- Final security hardening such as per-session write tokens and stricter origin policy than loopback-localhost allowlisting
- Perfect parity for every browser preview edge case, especially local asset rewriting inside rendered Markdown

## Decisions

### 1. Embed the first agent in the desktop process on a fixed loopback port

The desktop app will start a local HTTP server when Tauri starts. The browser client will use a fixed base URL and probe `/health` or equivalent API routes there.

- Why: it is the simplest way to make same-machine browser access real without introducing a second process manager or discovery file.
- Rejected alternative: build a sidecar now. That would add lifecycle, packaging, and cleanup complexity before the transport contract is proven.
- Rejected alternative: dynamic port discovery. That would require a separate discovery channel that the browser can reach before it knows where the agent lives.

### 2. Reuse the current desktop command surface through HTTP wrappers for the MVP

The local agent will call the same backend entry points that Tauri uses today so the browser and desktop already share persisted settings, user session state, tasks, and sync metadata.

- Why: the main value of this slice is truthful shared functionality, not a full backend re-modularization.
- Trade-off: `commands.rs` remains too large after this change, so deeper service extraction stays as explicit follow-up work.

### 3. Browser product mode defaults to local-agent transport, not mock fallback

When the UI is not running inside Tauri, it will try the local agent first and only use fixture behavior when an explicit developer flag is enabled.

- Why: silent fallback to sample data makes the product appear healthy when the real same-machine bridge is unavailable.
- Rejected alternative: keep automatic fallback from local agent to mock. That would preserve the current trust problem.

### 4. Browser authorization returns to the current page and exchanges the code through the local agent

Desktop mode keeps its existing OAuth listener flow. Browser mode starts authorization by asking the local agent for the authorize URL, redirects the current tab to Feishu, then handles the returned `code` on the app URL and posts it back to the local agent for exchange and persistence.

- Why: this keeps the browser auth flow real without requiring the browser itself to know the app secret.
- Rejected alternative: make the browser host its own callback listener. That would add more moving parts and duplicate the desktop/local-agent responsibility split.

### 5. Browser task updates use polling behind the same event-bridge API

The frontend task bridge will keep the same outward shape, but browser mode will implement it by polling the local agent and emitting the same task events that desktop mode receives from Tauri.

- Why: it lets existing task views keep working with minimal page churn.
- Rejected alternative: add SSE immediately. That is a valid follow-up once the HTTP contract is stable.

## Risks / Trade-offs

- [Fixed local port collision] -> keep the port configurable and surface an honest browser-unavailable state if the agent cannot start
- [Loopback HTTP adds write surface] -> bind only to loopback and keep CORS limited to localhost-style browser origins for this MVP
- [Commands module stays fat] -> reuse the current command surface now and record deeper backend extraction as follow-up work in the archive report
- [Polling is less immediate than desktop events] -> keep polling intervals short and reuse the existing task event shape so an SSE upgrade stays incremental
- [Browser Markdown preview may still have asset-path limitations] -> keep the read-preview path real in this slice but record image-asset parity as an explicit remaining gap if not fully closed
