---
name: openspec-all-in-one
description: Run an end-to-end OpenSpec workflow in one pass: propose, validate, apply, validate, archive, and git commit. Use when the user wants a simple request completed with minimal manual handoff, or asks for an OpenSpec change to be done "all in one", "一键完成", or fully automated.
license: MIT
compatibility: Requires openspec CLI and git.
metadata:
  author: openspec
  version: "1.0"
  generatedBy: "1.2.0"
---

Run an OpenSpec change from request to archive and commit in one guided workflow.

This skill combines:
- `openspec-propose`
- `openspec-apply-change`
- `openspec-archive-change`
- a final Git commit step

Use it when the user wants the whole workflow handled for them rather than calling each step separately.

---

**Input**: A change name, or a natural-language request describing what to build or fix.

## Workflow

1. **Classify the request**

   Decide whether the request is **simple** or **complex**.

   Treat as **simple** when most of these are true:
   - Small fix, small feature, or scoped documentation/config change
   - Single clear objective
   - Limited module impact
   - No meaningful architecture tradeoff

   Treat as **complex** when any of these are true:
   - Cross-cutting or multi-module work
   - Design tradeoffs are likely
   - Scope is ambiguous
   - The work may reasonably split into multiple changes

   If unsure, classify it as **complex**.

2. **Select or derive the change**

   - If the user provided a concrete change name, use it
   - Otherwise derive a kebab-case change name from the request
   - If the request may refer to an existing active change, verify before creating a new one

3. **Run proposal workflow**

   Follow the `openspec-propose` behavior:
   - Create the change if needed
   - Generate artifacts required for implementation
   - Read dependency artifacts and CLI instructions before writing files

4. **Validate after propose**

   Run:
   ```bash
   openspec validate --change "<name>"
   ```

   If validation fails:
   - Fix straightforward issues and re-run validation
   - If the fix is unclear or risky, pause and report the blocker

5. **Continue automatically after propose**

   If proposal validation passes, continue directly to implementation without asking for confirmation, even for **complex** work.

   Only pause here if a defined pause condition applies, such as:
   - the request is too ambiguous to propose safely
   - validation cannot be repaired confidently
   - the proposal/design reveals a blocker that needs a user decision

6. **Run implementation workflow**

   Follow the `openspec-apply-change` behavior:
   - Read context files from `openspec instructions apply --change "<name>" --json`
   - Implement pending tasks in order
   - Keep edits minimal and scoped
   - Mark completed tasks in `tasks.md` immediately
   - Stop if the work reveals a design issue that should be reflected in artifacts first

7. **Validate after apply**

   Run again:
   ```bash
   openspec validate --change "<name>"
   ```

   If validation fails:
   - Repair obvious issues and re-run
   - Do not continue to archive while validation is still meaningfully broken unless the user explicitly approves

8. **Continue automatically after apply**

   If implementation validation passes, continue directly to `archive + git commit` without asking for confirmation, even for **complex** work.

   Only pause here if a defined pause condition applies, such as:
   - implementation uncovers a design issue that should update artifacts first
   - validation cannot be repaired confidently
   - archiving would ignore meaningful unfinished work
   - committing would mix in unrelated changes

9. **Run archive workflow**

   Follow the `openspec-archive-change` behavior:
   - check incomplete artifacts/tasks
   - assess delta spec sync state
   - prompt when archive safeguards require confirmation
   - archive the change only after the required checks
   - if the normal archive move fails because the change directory is access-denied or otherwise locked, use a safe fallback:
     1. copy the full change directory into the intended archive target
     2. verify key files (such as `.openspec.yaml` and `tasks.md`) exist in the archive copy
     3. remove the original source directory only after verification succeeds
     4. report clearly that archive completed via copy+delete fallback

10. **Commit related changes**

   Only create a commit when the user's request clearly implies end-to-end completion or explicitly asks for commit as part of the one-shot flow.

   Before committing:
   - Inspect `git status`, `git diff`, and recent `git log`
   - Stage only files relevant to this change
   - Do not stage build outputs, caches, or unrelated local work
   - Do not include likely secret files

   Commit rules:
   - Use a concise message focused on intent
   - Pass the message via heredoc
   - Run `git status` after commit to confirm success
   - Do **not** push
   - If hooks fail, fix the issue and create a new commit rather than amending unless amend is explicitly justified by the repository rules

## Default Behavior

- When the user explicitly invokes `openspec-all-in-one`, run the whole workflow continuously through `proposal -> validate -> apply -> validate -> archive -> git commit`.
- Keep the `simple|complex` classification for risk awareness, progress reporting, and decision quality, but do **not** use complexity alone as a reason to pause.
- Pause only when a listed pause condition or a repository safety rule requires user confirmation.

## Pause Conditions

Pause and ask the user when:
- the request is too ambiguous to propose safely
- proposal, design, or implementation reveals a decision that materially changes scope or behavior
- implementation uncovers a design change that should update artifacts first
- validation cannot be repaired confidently
- archiving would ignore meaningful unfinished work
- committing would mix in unrelated changes
- a git safety rule requires explicit user confirmation before continuing

## Output Format

During execution, keep progress updates compact and structured like:

```text
## OpenSpec All-in-One

**Change:** <name>
**Complexity:** simple|complex
**Stage:** propose|validate|apply|archive|commit

<short progress note>
```

On completion, summarize:
- change name
- whether validation passed
- whether archive completed
- whether git commit succeeded
- any remaining issues

## Guardrails

- Reuse the existing OpenSpec skills' logic instead of inventing a parallel workflow
- Always read CLI-provided context files before implementation
- Prefer end-to-end momentum whenever this skill is explicitly invoked, but do not guess through ambiguity
- Keep code and artifact edits scoped to the chosen change
- Never push unless the user explicitly asks
- If the repo contains unrelated dirty changes, avoid mixing them into the final commit
- When archive move fails due to filesystem locking, prefer verified copy+delete fallback over repeated blind retries
