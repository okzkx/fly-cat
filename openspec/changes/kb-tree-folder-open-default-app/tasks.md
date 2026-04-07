## 1. Path mapping

- [x] 1.1 Add `mapFolderPath` in `src/services/path-mapper.ts` using the same sanitization as `mapDocumentPath`
- [x] 1.2 Add unit tests in `tests/path-mapper.test.ts` for folder path resolution

## 2. Tree UI

- [x] 2.1 In `HomePage.tsx` `titleRender`, render a folder-only icon button with tooltip「使用默认应用打开」, calling `openWorkspaceFolder` with `mapFolderPath`
- [x] 2.2 Align error messages with workspace open behavior and missing-directory case

## 3. Verification

- [x] 3.1 Run `npm run typecheck` and `npm test`
