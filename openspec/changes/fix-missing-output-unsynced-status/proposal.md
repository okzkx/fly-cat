## Why

When a synced document's local output is deleted, the knowledge tree still reports it as `已同步` because sync status currently trusts manifest success rows without checking whether the exported file still exists. This is especially visible during **强制更新**, where local files are intentionally stripped before the next sync starts, but the UI keeps showing the old synced state.

## What Changes

- Recalculate document sync status from manifest success rows only when the recorded local output still exists on disk.
- Let missing-output documents fall back to the existing `未同步` presentation in the knowledge tree, including the period after **强制更新** clears local files and before the next sync writes them again.
- Add focused regression coverage for the backend status mapping so deleted local outputs no longer appear synced.

## Capabilities

### New Capabilities

### Modified Capabilities

- `knowledge-tree-display`: knowledge-tree sync badges must stop treating missing local outputs as synced, even if a manifest success row still exists.

## Impact

- `src-tauri/src/commands.rs` status calculation and focused Rust tests
- `openspec/specs/knowledge-tree-display/spec.md`
- Existing frontend status rendering in `src/components/HomePage.tsx` via refreshed backend status data
