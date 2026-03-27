---
name: opencat-work
description: Run the OpenSpec all-in-one workflow inside a temporary git worktree branch: create an isolated linked worktree, execute propose/validate/apply/validate/archive/commit there, then return to the main worktree, fast-forward merge the completed branch, and remove the worktree and branch. Use when the user wants OpenSpec work done with worktree isolation, mentions git worktree/worktree branch, or asks for a safer one-shot workflow.
license: MIT
compatibility: Requires git, Node.js/npm, and OpenSpec CLI; auto-setup is allowed when missing.
metadata:
  author: opencat
  version: "1.0"
  derivedFrom: "openspec-all-in-one"
---

Run an OpenSpec change from request to archive and commit in an isolated git worktree, then merge it back and clean up.

This skill wraps the `openspec-all-in-one` workflow with a temporary linked worktree branch.

Use it when the user wants:
- end-to-end OpenSpec execution with branch isolation
- a disposable implementation workspace
- automatic merge-back and cleanup after the workflow completes

---

**Input**: A change name, or a natural-language request describing what to build or fix.

## Prerequisites

Before starting the workflow, verify the required tools exist and are usable in the current environment.

Required tools:
- `git`
- `node` and `npm`
- OpenSpec CLI via `openspec` or `npx openspec`

Check in this order:
1. Verify `git --version`.
2. Verify `node --version` and `npm --version`.
3. Verify OpenSpec with `openspec --version`.
4. If `openspec` is not on `PATH`, verify the local/npm entry with `npx openspec@latest --version`.

If something is missing, bootstrap it before continuing:
- If `git` is missing, install it with the host OS package manager when available, then re-check `git --version`.
- If `node` or `npm` is missing, install Node.js LTS first, then re-check both commands.
- If the repository dependencies are not installed and `package-lock.json` exists, run `npm install` at the repo root.
- If OpenSpec is missing, prefer a no-global path first: `npx openspec@latest --version`.
- If a persistent install is needed, install the official CLI package with `npm install -g @fission-ai/openspec@latest`, then verify `openspec --version`.

Bootstrap rules:
- Prefer the repository's existing package manager. In this repository, default to `npm` because `package-lock.json` is present.
- Verify each install immediately after it completes.
- Do not continue into worktree or OpenSpec steps while prerequisites are still missing.
- If installation requires elevated privileges, network access, or an OS-specific choice the agent cannot complete safely, pause and ask the user.

## Git Worktree Defaults

Follow these worktree practices:
- Create the linked worktree as a sibling directory outside the main working tree, not nested inside the repository.
- Create one temporary branch per request. Do not reuse a branch already checked out by another worktree.
- Inspect `git worktree list` before creating, merging, or cleaning up worktrees.
- Do all implementation, validation, archive, and commit work inside the linked worktree.
- Perform the merge from the main worktree on the base branch, not from inside the linked worktree.
- Prefer `git merge --ff-only` for the final merge. If fast-forward is not possible, pause and ask.
- Remove linked worktrees with `git worktree remove`, then run `git worktree prune` to clean stale metadata.
- Avoid `--force` for `git worktree add/remove` unless the user explicitly approves.

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

3. **Prepare the worktree plan**

   Before creating anything, inspect the current git state from the main worktree:
   - capture the current branch as the base branch
   - inspect `git status --short`
   - inspect `git worktree list --porcelain`

   Then derive:
   - `work_branch`: a temporary branch name such as `opencat/<change-name>`
   - `worktree_path`: a sibling path such as `../<repo-name>-opencat-<change-name>`

   Guardrails:
   - If `HEAD` is detached, pause unless the user explicitly wants that as the base
   - If the target branch name already exists or is checked out elsewhere, pause or choose a new name
   - If the target path already exists and is not clearly the intended disposable worktree, pause
   - If unrelated dirty changes in the main worktree would make the final merge unsafe, pause

4. **Create the linked worktree**

   Create the branch and linked worktree from the base branch:

   ```bash
   git worktree add -b "<work_branch>" "<worktree_path>" "<base_branch>"
   ```

   After creation:
   - verify it appears in `git worktree list`
   - perform all subsequent propose/apply/archive/commit work inside `worktree_path`

5. **Run proposal workflow inside the linked worktree**

   Follow the `openspec-propose` behavior:
   - create the change if needed
   - generate artifacts required for implementation
   - read dependency artifacts and CLI instructions before writing files

6. **Validate after propose**

   Inside the linked worktree, run:

   ```bash
   openspec validate --change "<name>"
   ```

   If validation fails:
   - fix straightforward issues and re-run validation
   - if the fix is unclear or risky, pause and report the blocker

7. **Continue automatically after propose**

   If proposal validation passes, continue directly to implementation without asking for confirmation, even for **complex** work.

   Only pause here if a defined pause condition applies, such as:
   - the request is too ambiguous to propose safely
   - validation cannot be repaired confidently
   - the proposal/design reveals a blocker that needs a user decision

8. **Run implementation workflow inside the linked worktree**

   Follow the `openspec-apply-change` behavior:
   - read context files from `openspec instructions apply --change "<name>" --json`
   - implement pending tasks in order
   - keep edits minimal and scoped
   - mark completed tasks in `tasks.md` immediately
   - stop if the work reveals a design issue that should be reflected in artifacts first

9. **Validate after apply**

   Inside the linked worktree, run again:

   ```bash
   openspec validate --change "<name>"
   ```

   If validation fails:
   - repair obvious issues and re-run
   - do not continue to archive while validation is still meaningfully broken unless the user explicitly approves

10. **Continue automatically after apply**

   If implementation validation passes, continue directly to `archive + git commit` without asking for confirmation, even for **complex** work.

   Only pause here if a defined pause condition applies, such as:
   - implementation uncovers a design issue that should update artifacts first
   - validation cannot be repaired confidently
   - archiving would ignore meaningful unfinished work
   - committing would mix in unrelated changes

11. **Run archive workflow inside the linked worktree**

   Follow the `openspec-archive-change` behavior:
   - check incomplete artifacts/tasks
   - assess delta spec sync state
   - prompt when archive safeguards require confirmation
   - archive the change only after the required checks
   - after archive succeeds, generate a Chinese Markdown report at `openspec/changes/archive/YYYY-MM-DD-<name>/change-report.zh-CN.md`
   - build the report from archived artifacts already present in that directory, especially `proposal.md`, `design.md`, `specs/**/*.md`, and `tasks.md`
   - keep the report concise and user-facing; include at least:
     - basic info (change name, schema, archive path)
     - change motivation summary
     - change scope summary
     - spec impact summary
     - task completion summary
   - if `design.md` is missing, omit the design section instead of failing the workflow
   - if the normal archive move fails because the change directory is access-denied or otherwise locked, use a safe fallback:
     1. copy the full change directory into the intended archive target
     2. verify key files such as `.openspec.yaml` and `tasks.md` exist in the archive copy
     3. remove the original source directory only after verification succeeds
     4. report clearly that archive completed via copy+delete fallback
   - when archive succeeds via either normal move or fallback, ensure the Chinese report is written into the final archived directory before moving to git commit

12. **Commit related changes inside the linked worktree**

   Only create a commit when the user's request clearly implies end-to-end completion or explicitly asks for commit as part of the one-shot flow.

   Before committing:
   - inspect `git status`, `git diff`, and recent `git log`
   - stage only files relevant to this change
   - do not stage build outputs, caches, or unrelated local work
   - do not include likely secret files

   Commit rules:
   - use a concise message focused on intent
   - pass the message via heredoc
   - run `git status` after commit to confirm success
   - do **not** push
   - if hooks fail, fix the issue and create a new commit rather than amending unless amend is explicitly justified by repository rules

13. **Return to the main worktree and merge**

   After the linked worktree workflow succeeds:
   - return to the original main worktree
   - ensure you are on `<base_branch>`
   - inspect `git status --short`
   - if unrelated local changes on the base branch would be mixed into the merge, pause and ask

   Merge the completed branch back with:

   ```bash
   git merge --ff-only "<work_branch>"
   ```

   If fast-forward merge fails:
   - pause and report that the branch diverged
   - do not auto-rebase, do not create an automatic merge commit, and do not force history changes without explicit approval

14. **Clean up the linked worktree and branch**

   After a successful merge:
   - remove the linked worktree with `git worktree remove "<worktree_path>"`
   - delete the temporary branch with `git branch -d "<work_branch>"`
   - run `git worktree prune`

   Cleanup rules:
   - if `git worktree remove` reports uncommitted or untracked content, pause instead of forcing removal
   - if the worktree was manually deleted earlier, use `git worktree prune` to clean stale metadata
   - do not delete the main worktree

## Default Behavior

- When the user explicitly invokes `opencat-work`, run the whole workflow continuously through `prepare -> worktree create -> propose -> validate -> apply -> validate -> archive -> commit -> merge -> cleanup`.
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
- the base branch is detached or otherwise unclear
- the target worktree path or branch name collides with existing state
- the final merge is not fast-forward clean
- cleanup would require forcing `git worktree remove` or branch deletion
- a git safety rule requires explicit user confirmation before continuing

## Output Format

During execution, keep progress updates compact and structured like:

```text
## OpenCat Work

**Change:** <name>
**Complexity:** simple|complex
**Base:** <base-branch>
**Worktree Branch:** <work-branch>
**Stage:** prepare|worktree|propose|validate|apply|archive|commit|merge|cleanup

<short progress note>
```

On completion, summarize:
- change name
- base branch
- worktree branch
- whether validation passed
- whether archive completed
- whether `change-report.zh-CN.md` was generated
- whether git commit succeeded
- whether merge succeeded
- whether worktree cleanup succeeded
- any remaining issues

## Guardrails

- Reuse the existing OpenSpec skills' logic instead of inventing a parallel workflow
- Always read CLI-provided context files before implementation
- Prefer sibling linked worktrees outside the repo root rather than nested disposable directories
- Do all risky edits in the linked worktree, then merge from the main worktree
- Prefer `git merge --ff-only` for the final integration
- Never auto-resolve merge conflicts, auto-rebase, or rewrite history without explicit approval
- Never push unless the user explicitly asks
- If the repo contains unrelated dirty changes, avoid mixing them into the final commit or merge
- When archive move fails due to filesystem locking, prefer verified copy+delete fallback over repeated blind retries
- Do not modify OpenSpec CLI/source code just to support report generation; generate the archive report as part of the skill-driven workflow
