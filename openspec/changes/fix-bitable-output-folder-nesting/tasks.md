## 1. Backend Path Fix

- [ ] 1.1 Update export-only output path generation so `bitable` / `sheet` files use parent path segments as directories and the leaf title only as the exported filename.
- [ ] 1.2 Add or update backend regression tests that assert nested export-only tables no longer produce a duplicate same-name folder.

## 2. Verification

- [ ] 2.1 Run focused backend tests covering export-only output paths and unchanged-path comparisons.
- [ ] 2.2 Validate the OpenSpec change after implementation updates are complete.
