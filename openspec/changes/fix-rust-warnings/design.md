## Context

The Tauri desktop application (Rust backend + React frontend) has 13 compiler warnings from `cargo check`. These are all dead-code or unused-variable warnings that accumulated during iterative development. No behavioral changes are needed - this is purely a code hygiene fix.

## Goals / Non-Goals

**Goals:**
- Achieve zero warnings from `cargo check`
- Preserve all existing functionality (test and production code)
- Use idiomatic Rust approaches for each warning type

**Non-Goals:**
- No refactoring beyond what is needed to silence warnings
- No changes to public API surface
- No removal of code that may be needed in the near term

## Decisions

### 1. Test-only functions: `#[cfg(test)]` gate

Functions like `make_fixture_document`, `fixture_documents_for_scope`, `build_scope_from_node`, `should_retry_document` etc. are private helpers used exclusively in `#[cfg(test)] mod tests`. Adding `#[cfg(test)]` to each is the standard Rust approach.

**Alternative considered**: Moving functions into the test module. Rejected because some are used by multiple test functions and keeping them in place minimizes churn.

### 2. Struct fields never read: `#[allow(dead_code)]` with comment

`SyncWriteResult` fields and `FeishuOAuthTokenInfo.token_type` are written during construction but only read in test code. Rather than gating the struct behind `#[cfg(test)]` (which would prevent non-test callers from using it), we use `#[allow(dead_code)]` on the specific fields. These fields represent a public data contract that may be consumed in the future.

**Alternative considered**: Removing unused fields. Rejected because they are part of a structured return type that carries meaningful data.

### 3. Unused variable: underscore prefix

The `session` variable at commands.rs:2404 is destructured from a tuple but unused. Prefixing with `_session` is the idiomatic Rust signal that the binding is intentionally unused.

### 4. `sync_document_to_disk` and `storage_error`: `#[cfg(test)]` gate

`sync_document_to_disk` is a `pub fn` only called from tests. `storage_error` is a private helper only called by `sync_document_to_disk`. Both get `#[cfg(test)]`.

**Note**: `sync_document_to_disk` is `pub`, meaning gating it changes the crate's public API. Since no external crate currently depends on it (this is a binary crate, not a library), this is safe.

## Risks / Trade-offs

- [Gating `pub` functions with `#[cfg(test)]`] → Minimal risk since this is a binary crate with no external consumers of these APIs.
- [Adding `#[allow(dead_code)]`] → Risk of accumulating genuinely unused code. Mitigated by adding comments explaining why the annotation exists.
