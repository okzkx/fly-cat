# browser-compatible-client-utilities Specification

## Purpose
TBD - created by archiving change browser-safe-hashing. Update Purpose after archive.
## Requirements
### Requirement: Browser-safe path utility hashing

Frontend utility modules that are loaded in the client bundle MUST NOT depend on Node-only crypto APIs for deterministic path helper behavior. When the UI needs a collision suffix for path disambiguation, the helper MUST return the same eight-character lowercase hexadecimal suffix for the same document id across runs without requiring `node:crypto`.

#### Scenario: Home page loads without Node crypto externalization failure

- **WHEN** the application loads browser-bundled UI code that imports the path-mapping utility
- **THEN** the module loads successfully without throwing a Vite `Module "node:crypto" has been externalized for browser compatibility` error

#### Scenario: Collision suffix remains deterministic

- **WHEN** the application asks for a path collision suffix for the same document id multiple times
- **THEN** the helper returns the same eight-character lowercase hexadecimal suffix each time
- **AND** different document ids can still produce different suffix values for tie-breaking purposes

