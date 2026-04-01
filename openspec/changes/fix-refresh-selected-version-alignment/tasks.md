## 1. Refresh scope and UI flow

- [x] 1.1 Change `HomePage` bulk refresh selection from all synced documents to the currently checked synced leaves, and update button disabled/loading behavior accordingly.
- [x] 1.2 Keep the refreshed in-memory freshness map aligned with the manifest-backed local version metadata after the bulk refresh finishes.

## 2. Persist local version alignment

- [x] 2.1 Add a Tauri command plus storage helper that updates manifest version/update-time fields for selected synced records when the refreshed remote version should replace the local version.
- [x] 2.2 Reload sync statuses after alignment and add focused regression coverage for the manifest alignment rule.
