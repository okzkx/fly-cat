## Why

The app currently reports `连接校验失败` and returns an empty knowledge base list even when the Feishu app has been granted cloud document permissions and the same app can access knowledge bases from the reference project. This blocks real-world onboarding and suggests that the current validation or discovery path is using the wrong API assumptions, permission checks, or error interpretation.

## What Changes

- Adjust connection validation so it verifies Feishu knowledge base access using the same effective access path as the sync workflow, rather than failing early on a narrower or incompatible check.
- Distinguish between `no joined knowledge spaces`, `insufficient wiki read access`, `API response incompatible`, and `validation request failed` so the UI does not collapse multiple root causes into a generic failure.
- Ensure knowledge base discovery can return accessible spaces for apps that already work in the reference project, including cases where validation should degrade gracefully and still allow downstream discovery.
- Add targeted observability around connection validation and knowledge base enumeration so mismatches between the reference project and this app can be diagnosed quickly.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `knowledge-base-source-sync`: refine knowledge space discovery and access validation requirements so accessible spaces are discoverable under real Feishu app permissions and compatible with the reference project behavior.
- `sync-focused-application-experience`: refine error reporting and empty-state guidance so users see actionable diagnostics instead of a generic connection validation failure.

## Impact

- Affects Feishu/MCP connection validation, knowledge space enumeration, and any backend command or service that currently gates discovery on a strict preflight check.
- Affects frontend settings/auth/home flows that display connection status, space list loading, and empty/error guidance.
- Requires requirement updates for discovery behavior and user-facing diagnostics, plus implementation work in backend validation logic and UI error mapping.
