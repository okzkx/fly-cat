## Why

Ant Design 6 deprecates `Space.direction` and `Spin.tip`, emitting console warnings during development. Replacing them with `Space.orientation` and `Spin.description` removes noise without changing layout or behavior.

## What Changes

- Replace all `Space` usages of `direction="vertical"` (and horizontal if any) with the supported `orientation` prop.
- Replace `Spin` usages of `tip` with `description`.
- No visual or interaction changes intended.

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `reference-app-shell-alignment`: Clarify that shell UI should follow current Ant Design component APIs without deprecation warnings in dev builds.

## Impact

- React components under `src/components/` that use `Space` or `Spin` from `antd`.
- Dependency: existing `antd` version already exposing `orientation` / `description`.
