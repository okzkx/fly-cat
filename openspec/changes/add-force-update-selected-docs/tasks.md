## 1. Toolbar refresh behavior

- [ ] 1.1 Add a separate `强制更新` toolbar action for the currently checked synced leaves while preserving the existing `全部刷新` button semantics.
- [ ] 1.2 Route both bulk metadata actions through a shared refresh flow that reloads freshness metadata and sync statuses after completion.

## 2. Alignment modes and regression coverage

- [ ] 2.1 Parameterize manifest version alignment so normal refresh keeps the conditional rule and force update always mirrors successful remote metadata into existing manifest rows.
- [ ] 2.2 Add focused regression coverage for both normal alignment and forced overwrite behavior, then validate the OpenSpec change and the affected app code paths.
