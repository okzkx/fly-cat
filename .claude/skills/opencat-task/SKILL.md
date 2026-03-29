---
name: opencat-task
description: Run a staged OpenSpec workflow with checkpoint commits and reusable linked worktree copies: finish the purpose/proposal stage in the main worktree, create a branch and record the purpose commit, select or create a `-worktree` sibling copy for apply, rebase onto the latest trunk before archive, commit after apply and archive, merge back, delete the branch, and keep the worktree copies for reuse. Use when the user wants end-to-end OpenSpec work with safer git checkpoints and reusable worktree isolation, including automatic fallback to another worktree copy when one is already occupied. Prerequisite: run `opencat-check` manually before invoking this skill.
license: MIT
compatibility: Requires `opencat-check` to have been run manually to satisfy git, node/npm, OpenSpec CLI, and repository dependencies.
metadata:
  author: opencat
  version: "1.5"
  derivedFrom: "openspec-all-in-one"
---

Run an OpenSpec change from purpose to archive with staged git checkpoints and reusable linked worktree copies.

This skill wraps `openspec-all-in-one` with:
- a purpose record commit
- an apply checkpoint commit
- an archive commit
- reusable linked worktree copies that are kept for the next run

Use it when the user wants:
- end-to-end OpenSpec execution with git checkpoints
- proposal work done before branching into a worktree
- reusable implementation worktree copies instead of disposable worktrees
- automatic merge-back after archive
- automatic creation of another worktree copy when the shared one is occupied

---

**Input**: A change name, or a natural-language request describing what to build or fix.

## Terminology

- `purpose stage`: the proposal stage that creates or updates change artifacts before implementation.
- `trunk`: the base branch the user started from, usually `main` or `master`.

## Dependency

`opencat-check` must be run **manually** before invoking this skill.

`opencat-task` does **not** run environment checks itself:
- do not invoke `opencat-check` from this skill
- do not duplicate prerequisite checks here
- do not invent bootstrap logic here

## Git Defaults **必须使用 worktree 功能完成任务**

Follow these repository practices:
- Keep the main worktree on `<base_branch>` for purpose work, trunk refresh, and final merge.
- Create one temporary work branch per change, such as `opencat/<change-name>`.
- Name reusable linked worktree copies with a `-worktree` suffix.
- Prefer the primary sibling path `../<repo-name>-worktree`.
- If the primary path is occupied, create another sibling copy that still ends with `-worktree`, such as `../<repo-name>-2-worktree`, `../<repo-name>-3-worktree`, and so on.
- Reuse an existing linked worktree copy only when it is on `<base_branch>` and clean enough for safe reuse.
- If an existing linked worktree copy is not on `<base_branch>`, treat it as occupied by another AI run and create the next available `-worktree` copy instead of reusing it.
- Use the linked worktree only from the apply stage onward.
- Keep linked worktree directories after the workflow completes so they can be reused next time.
- Before deleting `<work_branch>`, switch the linked worktree off that branch, typically back to `<base_branch>`.
- Use an explicit merge commit for final integration: `git merge --no-ff "<work_branch>"`.
- If `git rebase` or `git merge` reports conflicts, the AI must resolve them directly and continue the workflow unless the repository state is technically unrecoverable.
- Never rewrite `<base_branch>` history and never push unless the user explicitly asks.

## Git Checkpoint Commits

Create up to three commits in this workflow:
1. `purpose commit`: records the purpose/proposal artifacts after purpose validation passes.
2. `apply commit`: records implementation work after apply validation passes.
3. `archive commit`: records archive results after the Chinese archive report is generated.

Before each commit:
- inspect `git status`, relevant `git diff`, and recent `git log`
- stage only files relevant to the current checkpoint
- do not stage build outputs, caches, secrets, or unrelated local work

Commit message rules:
- all three commits **must** start with a stage prefix: `[propose]`, `[apply]`, or `[archive]` respectively
- `purpose commit`: message format `[propose] <change-name>: <concise description of the purpose/proposal artifacts>`
- `apply commit`: message format `[apply] <change-name>: <concise description of the completed implementation work>`
- `archive commit`: message format `[archive] <change-name>: <Chinese summary title from change-report.zh-CN.md>`
- for the archive commit, use the report's Chinese summary as the source of truth for both title and message body
- keep the archive title concise and summary-like, reflecting the main outcome of the archived change
- keep the archive body aligned with the report's key points, such as motivation, scope, spec impact, and task completion, when those sections exist
- when running in Windows PowerShell, do **not** use bash heredoc syntax such as `$(cat <<'EOF' ...)`; instead use a PowerShell here-string variable and pass it to `git commit -m $message`, or run separate `-m` arguments
- avoid chaining git commands with `&&` in Windows PowerShell; run them as separate commands or guard with `$LASTEXITCODE`
- run `git status` after each commit to confirm success

## Workflow

1. **Classify the request**

   Decide whether the request is `simple` or `complex`.

   Treat as `simple` when most of these are true:
   - small fix, small feature, or scoped documentation/config change
   - single clear objective
   - limited module impact
   - no meaningful architecture tradeoff

   Treat as `complex` when any of these are true:
   - cross-cutting or multi-module work
   - design tradeoffs are likely
   - scope is ambiguous
   - the work may reasonably split into multiple changes

   If unsure, classify it as `complex`.

2. **Select or derive the change**

   - if the user provided a concrete change name, use it
   - otherwise derive a kebab-case change name from the request
   - if the request may refer to an existing active change, verify before creating a new one

3. **Prepare the git plan from the main worktree**

   From the main worktree:
   - capture the current branch as `<base_branch>`
   - inspect `git status --short`
   - inspect `git worktree list --porcelain`

   Then derive:
   - `work_branch`: a temporary branch name such as `opencat/<change-name>`
   - `worktree_base_path`: the primary reusable sibling path `../<repo-name>-worktree`
   - `worktree_path`: the selected reusable sibling path for this run

   Guardrails:
   - if `HEAD` is detached, pause unless the user explicitly wants that as the base
   - if unrelated dirty changes in the main worktree would make purpose, commits, rebase, or merge unsafe, pause
   - if `work_branch` already exists and does not match the intended change, pause
   - if an existing candidate worktree is on `<base_branch>` but dirty, blocked, or otherwise unsafe to reuse, skip it and keep scanning for another candidate or create the next `-worktree` copy
   - pause only if no existing candidate can be reused and a new `-worktree` copy cannot be created safely

4. **Run the purpose stage in the main worktree**

   Do **not** create a worktree yet and do **not** move to the linked worktree yet.

   Invoke the `openspec-propose` skill directly with the change name or request description as arguments.

5. **Validate after purpose**

   In the main worktree, run:

   ```bash
   openspec validate --change "<name>"
   ```

   If validation fails:
   - fix straightforward issues and re-run validation
   - if the fix is unclear or risky, pause and report the blocker

6. **Create the branch and record the purpose commit**

   After purpose validation passes:
   - create and switch to `<work_branch>` from the current main-worktree state
   - stage only purpose artifacts relevant to the change
   - create the `purpose commit`
   - switch the main worktree back to `<base_branch>` after the commit so trunk remains available there

   Pause if:
   - the purpose commit would mix in unrelated changes
   - the branch cannot be created safely

7. **Prepare or reuse the linked worktree for apply**

   The apply stage is the first point where the linked worktree is used.

   - inspect reusable sibling paths in this order: `../<repo-name>-worktree`, then `../<repo-name>-2-worktree`, `../<repo-name>-3-worktree`, and so on
   - if a candidate path does not exist, create a linked worktree there from `<base_branch>` and use it
   - if a candidate path already exists and is on `<base_branch>` and clean, reuse it
   - if a candidate path already exists but is detached and clean, reuse it (detached is normal after a previous merge + branch delete)
   - if a candidate path already exists and is on a different named branch (not detached), treat it as occupied by another AI run and continue to the next candidate instead of blocking
   - if a candidate path already exists on `<base_branch>` but is dirty or otherwise unsafe, continue to the next candidate or create a new one
   - in the linked worktree, switch to `<work_branch>`
   - verify `git worktree list` reflects the expected branch/path before continuing

8. **Run implementation in the linked worktree**

   Invoke the `openspec-apply-change` skill directly with the change name as arguments.

9. **Validate after apply**

   In the linked worktree, run again:

   ```bash
   openspec validate --change "<name>"
   ```

   If validation fails:
   - repair obvious issues and re-run
   - do not continue to the apply commit or archive while validation is meaningfully broken unless the user explicitly approves

10. **Create the apply commit**

    After apply validation passes:
    - stage only implementation files relevant to the change
    - create the `apply commit`

11. **Refresh trunk and rebase before archive**

    Before archive, move the work branch onto the latest trunk state.

    - in the main worktree, refresh `<base_branch>` to the latest available trunk state
    - if `<base_branch>` tracks a remote branch, prefer `git fetch` plus a safe fast-forward update such as `git pull --ff-only`
    - if the trunk refresh cannot complete safely, pause
    - in the linked worktree, rebase `<work_branch>` onto the refreshed `<base_branch>`

    If rebase reports conflicts:
    - inspect each conflicted file and resolve the conflict directly as the default behavior
    - preserve the change intent from `<work_branch>` while keeping valid non-overlapping updates from refreshed trunk
    - continue the rebase and validate again when needed after resolving conflicts
    - do not ask the user to resolve ordinary or ambiguous code conflicts for you; the AI should finish the conflict resolution itself
    - pause only if the repository state is technically unrecoverable, such as corrupted git metadata or missing conflict inputs that prevent completing the rebase

12. **Run archive in the linked worktree**

    Invoke the `openspec-archive-change` skill directly with the change name as arguments.

    After the archive skill completes:
    - generate a Chinese Markdown report at `openspec/changes/archive/YYYY-MM-DD-<name>/change-report.zh-CN.md`
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
    - when archive succeeds via either normal move or fallback, ensure the Chinese report is written into the final archived directory before moving to the archive commit

13. **Create the archive commit**

    After archive and report generation succeed:
    - stage only archive-related files relevant to the change
    - create the `archive commit`

14. **Merge back from the main worktree**

    After the linked worktree workflow succeeds:
    - return to the original main worktree
    - ensure you are on `<base_branch>`
    - inspect `git status --short`
    - if unrelated local changes on the base branch would be mixed into the merge, pause

    Merge the completed branch back with:

    ```bash
    git merge --no-ff "<work_branch>"
    ```

    If merge reports conflicts:
    - inspect each conflicted file and resolve the conflict directly as the default behavior
    - preserve the archived change intent from `<work_branch>` while keeping valid non-overlapping updates already present on `<base_branch>`
    - run the relevant validation needed to confirm the merged result is still correct
    - stage the resolved files and complete the merge commit
    - do not hand ordinary or ambiguous code conflicts back to the user; the AI should finish the merge conflict resolution itself
    - pause only if the repository state is technically unrecoverable, such as corrupted git metadata or missing conflict inputs that prevent completing the merge

    If merge cannot complete cleanly for reasons other than ordinary file conflicts:
    - pause and report the blocking state

15. **Keep the worktree and delete the branch**

    After a successful merge:
    - in the linked worktree, switch back to `<base_branch>` and ensure it is clean
    - from the main worktree, delete `<work_branch>`
    - keep `worktree_path` in place for the next `opencat-task` run
    - keep any other existing `-worktree` sibling copies in place for future reuse
    - do **not** remove linked worktree directories unless the user explicitly asks

16. **Verify cleanup**

    After cleanup steps, verify the workflow completed cleanly:
    - confirm `<work_branch>` no longer exists: `git branch --list "<work_branch>"` should return empty
    - confirm linked worktree is on `<base_branch>`: `git -C "<worktree_path>" branch --show-current` should return `<base_branch>`
    - confirm linked worktree is clean: `git -C "<worktree_path>" status --short` should return empty
    - confirm no orphaned archive directories with placeholder dates exist: `openspec/changes/archive/YYYY-MM-DD-*` should not exist
    - report any anomalies in the completion summary

    If verification fails:
    - attempt to fix the anomaly if safe (e.g., delete orphan branch, switch worktree to base branch, remove placeholder archive directories)
    - if the anomaly cannot be safely fixed, include it as a "remaining issue" in the completion summary

## Default Behavior

- When the user explicitly invokes `opencat-task`, run the whole workflow continuously through `purpose -> validate -> purpose-commit -> worktree -> apply -> validate -> apply-commit -> rebase -> archive -> archive-commit -> merge -> cleanup -> verify`.
- Keep the `simple|complex` classification for risk awareness, progress reporting, and decision quality, but do **not** use complexity alone as a reason to pause.
- Pause only when a listed pause condition or a repository safety rule requires user confirmation.

## Pause Conditions

Pause and ask the user when:
- the request is too ambiguous to propose safely
- purpose, design, or implementation reveals a decision that materially changes scope or behavior
- implementation uncovers a design change that should update artifacts first
- validation cannot be repaired confidently
- the purpose, apply, or archive commit would mix in unrelated changes
- trunk refresh cannot complete safely
- every discovered `-worktree` candidate is unsafe to reuse and a new one cannot be created safely
- the base branch is detached or otherwise unclear
- the target branch name collides with existing state
- deleting the branch would fail because the linked worktree is still attached to it
- a git safety rule requires explicit user confirmation before continuing

## Output Format

During execution, keep progress updates compact and structured like:

```text
## OpenCat Work

**Change:** <name>
**Complexity:** simple|complex
**Base:** <base-branch>
**Worktree Branch:** <work-branch>
**Stage:** purpose|validate|purpose-commit|worktree|apply|validate|apply-commit|rebase|archive|archive-commit|merge|cleanup|verify

<short progress note>
```

On completion, summarize:
- change name
- base branch
- worktree branch
- whether purpose commit succeeded
- whether apply commit succeeded
- whether archive commit succeeded
- whether validation passed
- whether archive completed
- whether `change-report.zh-CN.md` was generated
- whether merge succeeded
- whether the branch was deleted
- whether cleanup verification passed
- which `worktree_path` was used
- whether the linked worktree copy was kept for reuse
- any remaining issues

## Guardrails

- **IMPORTANT: worktree 内的任务做完后，确保所有的变更都从分支合并到了主干 并且 Never delete linked worktree directories** - They are meant to be kept for reuse. After merge, only switch worktree back to `<base_branch>` and delete the work branch. The worktree directory itself must remain.
- Invoke the existing OpenSpec skills directly (`openspec-propose`, `openspec-apply-change`, `openspec-archive-change`) instead of inventing a parallel workflow or trying to replicate their behavior
- `opencat-check` must be run manually before this skill; do not invoke it from within the workflow
- Always read CLI-provided context files before implementation
- Prefer reusable linked worktree copies outside the repo root rather than disposable per-change worktrees
- Use `-worktree` suffix naming for reusable worktree copies and create the next numbered copy when an existing one is occupied
- Keep purpose work in the main worktree until the purpose checkpoint commit exists
- Do all apply, rebase, and archive work in the linked worktree
- Refresh trunk before archive so archive happens on top of the latest available base
- Prefer an explicit `git merge --no-ff` for final integration so branch history and checkpoint commits remain visible
- Resolve `git rebase` and `git merge` conflicts directly as the default behavior and complete the conflict-handling flow without delegating it back to the user unless the git state is technically unrecoverable
- Never auto-rewrite `<base_branch>` history and never push unless the user explicitly asks
- If the repo contains unrelated dirty changes, avoid mixing them into checkpoint commits, rebase, or merge
- When archive move fails due to filesystem locking, prefer verified copy+delete fallback over repeated blind retries
- Do not modify OpenSpec CLI/source code just to support report generation; generate the archive report as part of the skill-driven workflow
- In Windows PowerShell environments, prefer PowerShell-native command composition over bash-specific syntax so git inspection and commit steps do not fail on shell parsing
