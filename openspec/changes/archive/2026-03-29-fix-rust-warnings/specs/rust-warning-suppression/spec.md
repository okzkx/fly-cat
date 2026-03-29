## ADDED Requirements

### Requirement: Zero Rust compiler warnings
The Rust backend SHALL compile with zero warnings under `cargo check`. Each warning category SHALL be addressed using the idiomatic Rust suppression technique.

#### Scenario: Clean cargo check
- **WHEN** `cargo check` is run in `src-tauri/`
- **THEN** zero warnings are reported

#### Scenario: Test-only functions are gated
- **WHEN** a private function is used only in `#[cfg(test)] mod tests`
- **THEN** the function SHALL be annotated with `#[cfg(test)]`

#### Scenario: Unused struct fields are annotated
- **WHEN** a struct field is written during construction but only read in test code
- **THEN** the field SHALL be annotated with `#[allow(dead_code)]` and a comment explaining why

#### Scenario: Unused variables are prefixed
- **WHEN** a variable is destructured from a tuple but intentionally unused
- **THEN** the variable SHALL be prefixed with an underscore
