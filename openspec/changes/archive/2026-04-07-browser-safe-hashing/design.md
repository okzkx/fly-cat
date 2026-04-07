## Context

`src/services/path-mapper.ts` is imported by browser-loaded UI code such as `HomePage`. Its top-level `node:crypto` import causes Vite to externalize the module and throw before the page can render. The only crypto-backed behavior in that file is `buildPathCollisionSuffix()`, which currently returns the first eight hex characters of a SHA-1 digest for a document id.

The existing call shape is synchronous, and the suffix is only used as a deterministic collision tie-breaker rather than a security boundary or content-integrity checksum.

## Goals / Non-Goals

**Goals:**
- Remove the browser-incompatible `node:crypto` dependency from frontend-loaded path utilities.
- Preserve deterministic, synchronous eight-character suffix generation.
- Keep existing path sanitization and path mapping behavior unchanged.

**Non-Goals:**
- Rework backend-only hashing logic used by sync storage, manifests, or image fallback assets.
- Introduce asynchronous hashing APIs into current path helper call sites.
- Change the persisted path layout for already-synced documents beyond the existing suffix contract.

## Decisions

### Use a small synchronous pure TypeScript hash for path collision suffixes

`buildPathCollisionSuffix()` will switch from SHA-1 to a synchronous browser-safe hash implementation in plain TypeScript. A 32-bit FNV-1a style accumulator is sufficient because the suffix is only a short deterministic disambiguator, not a cryptographic checksum.

Rejected alternatives:
- Web Crypto `subtle.digest`: browser-safe, but asynchronous and would force API and call-site changes for a simple suffix helper.
- Keeping `node:crypto` behind conditional runtime checks: the import itself still breaks the browser bundle.
- Moving the helper into Tauri/Rust: unnecessary coupling for a lightweight frontend path utility.

### Limit the scope to browser-loaded utilities

This change only removes the incompatible dependency from modules that are part of the frontend bundle. Other Node-backed sync helpers remain out of scope unless they later become browser-loaded.

## Risks / Trade-offs

- Lower collision resistance than SHA-1 for the suffix helper -> acceptable because the helper is a short tie-breaker and still deterministic for the same document id.
- Future refactors could reintroduce Node-only imports into browser utilities -> mitigate with targeted regression tests around suffix generation and the affected module behavior.
