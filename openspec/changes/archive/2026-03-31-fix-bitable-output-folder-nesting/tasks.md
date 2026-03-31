## 1. Backend Path Fix

- [x] 1.1 Update export-only output path generation so `bitable` / `sheet` files use parent path segments as directories and the leaf title only as the exported filename.
- [x] 1.2 Add or update backend regression tests that assert nested export-only tables no longer produce a duplicate same-name folder.

## 2. Verification

- [x] 2.1 Run focused backend tests covering export-only output paths and unchanged-path comparisons.
- [x] 2.2 Validate the OpenSpec change after implementation updates are complete.
