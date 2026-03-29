## 1. Rust Backend - SQLite Storage

- [x] 1.1 Add `rusqlite` dependency to `Cargo.toml`
- [x] 1.2 Create `freshness_db_path()` function in `storage.rs`
- [x] 1.3 Create `init_freshness_db()` function to initialize table schema
- [x] 1.4 Implement `load_all_freshness_metadata()` function
- [x] 1.5 Implement `save_freshness_metadata()` function
- [x] 1.6 Implement `clear_freshness_metadata()` function

## 2. Rust Backend - Tauri Commands

- [x] 2.1 Add `load_freshness_metadata` Tauri command in `commands.rs`
- [x] 2.2 Add `save_freshness_metadata` Tauri command
- [x] 2.3 Add `clear_freshness_metadata` Tauri command
- [x] 2.4 Register all commands in `lib.rs`

## 3. Frontend - TypeScript Integration

- [x] 3.1 Import `DocumentFreshnessResult` type in `tauriRuntime.ts`
- [x] 3.2 Add `checkDocumentFreshness()` function
- [x] 3.3 Add `loadFreshnessMetadata()` function
- [x] 3.4 Add `saveFreshnessMetadata()` function
- [x] 3.5 Add `clearFreshnessMetadata()` function

## 4. Frontend - UI Components

- [x] 4.1 Import required icons in `HomePage.tsx`
- [x] 4.2 Add `FreshnessIndicator` component
- [x] 4.3 Add `freshnessMap` state in `HomePage` component
- [x] 4.4 Add `useEffect` to load freshness metadata on mount
- [x] 4.5 Add `useEffect` to check freshness with debounce
- [x] 4.6 Render `FreshnessIndicator` in tree node titleRender

## 5. Testing & Verification

- [x] 5.1 Verify `cargo check` passes
- [x] 5.2 Verify `cargo test` passes
- [x] 5.3 Verify frontend builds with `npm run build`
- [ ] 5.4 Manual test: sync document and verify freshness indicator shows
