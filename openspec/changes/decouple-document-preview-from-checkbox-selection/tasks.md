## 1. Tree interaction wiring

- [ ] 1.1 Stop calling `handleTriStateToggle` from `handleSelect` so title clicks do not toggle sync checkboxes
- [ ] 1.2 Remove `onScopeChange` from `handleTriStateToggle` so checkbox toggles do not update preview scope
- [ ] 1.3 In `handleSelect`, ignore events whose target is inside `.ant-tree-checkbox` so checkbox never updates preview via `onSelect`

## 2. Verification

- [ ] 2.1 Run `openspec validate --change decouple-document-preview-from-checkbox-selection`
- [ ] 2.2 Run frontend build or tests if present (`npm run build` / `npm test`)
