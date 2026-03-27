## Why

The application's in-product branding is still inconsistent, with some titles and labels using "Feishu sync" wording instead of the intended product name "FlyCat / 飞猫助手". This creates avoidable product drift and makes the app feel unfinished even though project-facing materials already use the FlyCat brand.

## What Changes

- Replace in-app product titles, header branding, and similar user-facing shell labels with the FlyCat / 飞猫助手 brand.
- Update in-app logo or brand mark usage so visible application chrome matches the FlyCat brand instead of generic Feishu sync wording.
- Normalize page-level and task-related user-facing branding text so the application presents one consistent product identity across settings, auth, home, and task views.
- Keep functional sync terminology where it describes behavior, while removing outdated product naming such as "飞书同步xxx" when it is acting as app branding.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `reference-app-shell-alignment`: refine shell/header branding requirements so the top-level application identity is consistently presented as FlyCat / 飞猫助手.
- `sync-focused-application-experience`: refine user-facing page and task branding text so application titles and visible brand cues stay consistent across the sync workflow.

## Impact

- Affects frontend shell components, page headers, and user-visible labels that currently expose inconsistent app naming.
- May affect shared visual assets or lightweight logo rendering where the current shell still uses generic sync branding.
- Requires requirement updates so branding consistency is treated as product behavior rather than a one-off cosmetic edit.
