## 1. Rust Backend - SQLite Storage

- [ ] 1.1 Add `rusqlite` dependency to `Cargo.toml`
- [ ] 1.2 Create `freshness_db_path()` function in `storage.rs`
- [ ] 1.3 Create `init_freshness_db()` function to initialize table schema
- [ ] 1.4 Implement `load_all_freshness_metadata()` function
- [ ] 1.5 Implement `save_freshness_metadata()` function
- [ ] 1.6 Implement `clear_freshness_metadata()` function

## 2. Rust Backend - Tauri Commands

- [ ] 2.1 Add `load_freshness_metadata` Tauri command in `commands.rs`
- [ ] 2.2 Add `save_freshness_metadata` Tauri command
- [ ] 2.3 Add `clear_freshness_metadata` Tauri command
- [ ] 2.4 Register all commands in `lib.rs`

## 3. Frontend - TypeScript Integration

- [ ] 3.1 Import `DocumentFreshnessResult` type in `tauriRuntime.ts`
- [ ] 3.2 Add `checkDocumentFreshness()` function
- [ ] 3.3 Add `loadFreshnessMetadata()` function
- [ ] 3.4 Add `saveFreshnessMetadata()` function
- [ ] 3.5 Add `clearFreshnessMetadata()` function

## 4. Frontend - UI Components

- [ ] 4.1 Import required icons in `HomePage.tsx`
- [ ] 4.2 Add `FreshnessIndicator` component
- [ ] 4.3 Add `freshnessMap` state in `HomePage` component
- [ ] 4.4 Add `useEffect` to load freshness metadata on mount
- [ ] 4.5 Add `useEffect` to check freshness with debounce
- [ ] 4.6 Render `FreshnessIndicator` in tree node titleRender

## 5. Testing & Verification

- [ ] 5.1 Verify `cargo check` passes
- [ ] 5.2 Verify `cargo test` passes
- [ ] 5.3 Verify frontend builds with `npm run build`
- [ ] 5.4 Manual test: sync document and verify freshness indicator shows
