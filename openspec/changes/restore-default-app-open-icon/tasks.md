## 1. Path mapping

- [ ] 1.1 Add a helper that maps a document/bitable `SyncScope` to the same on-disk Markdown path as `mapDocumentPath` for synced exports.

## 2. Backend opener

- [ ] 2.1 Update `open_workspace_folder` to allow existing files (not only directories) and open them with the default application.

## 3. Knowledge tree UI

- [ ] 3.1 Show the “使用默认应用打开” control on document and bitable nodes and wire it to open the computed Markdown path with user-visible errors when missing.

## 4. Verification

- [ ] 4.1 Run `openspec validate restore-default-app-open-icon --type change` and ensure the project still builds (e.g. `npm run build` or `cargo check` as appropriate).
