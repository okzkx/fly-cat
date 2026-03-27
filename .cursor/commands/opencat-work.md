---
name: /opencat-work
id: opencat-work
category: Workflow
description: Run OpenSpec all-in-one inside a temporary git worktree branch
---

Run an OpenSpec change end-to-end in an isolated git worktree, then merge it back and clean up.

**Input**: A change name, or a natural-language request describing what to build or fix.

**Steps**

1. **Verify prerequisites and bootstrap if needed**

   Before the workflow begins, verify:
   - `git --version`
   - `node --version`
   - `npm --version`
   - `openspec --version`

   If OpenSpec is not on `PATH`, try:
   ```bash
   npx openspec@latest --version
   ```

   If something is missing:
   - install `git` via the host OS package manager when available
   - install Node.js LTS if `node` or `npm` is missing
   - run `npm install` at the repo root when repository dependencies are missing and `package-lock.json` is present
   - prefer `npx openspec@latest` first for OpenSpec
   - if a persistent install is needed, install `@fission-ai/openspec` and verify again

   Rules:
   - Prefer the repository's existing package manager. In this repo, default to `npm`.
   - Verify each install immediately after completion.
   - Do not continue while prerequisites are still missing.
   - If installation requires elevated privileges, network access, or an OS-specific choice that is unsafe to guess, pause and ask.

2. **Classify the request**

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

3. **Select or derive the change**

   - If the user provided a concrete change name, use it
   - Otherwise derive a kebab-case change name from the request
   - If the request may refer to an existing active change, verify before creating a new one

4. **Prepare the worktree plan**

   From the main worktree:
   - capture the current branch as the base branch
   - inspect `git status --short`
   - inspect `git worktree list --porcelain`

   Then derive:
   - `work_branch`: a temporary branch such as `opencat/<change-name>`
   - `worktree_path`: a sibling path such as `../<repo-name>-opencat-<change-name>`

   Pause if:
   - `HEAD` is detached and the base is unclear
   - the branch name already exists or is checked out elsewhere
   - the path already exists and is not clearly disposable
   - unrelated dirty changes would make final merge unsafe

5. **Create the linked worktree**

   Run:
   ```bash
   git worktree add -b "<work_branch>" "<worktree_path>" "<base_branch>"
   ```

   Then verify the new worktree appears in `git worktree list`.

6. **Run OpenSpec all-in-one inside the linked worktree**

   Inside `worktree_path`, follow the full OpenSpec workflow:
   - propose
   - validate
   - apply
   - validate
   - archive
   - commit

   Requirements:
   - read CLI-provided context files before implementation
   - keep edits minimal and scoped
   - update `tasks.md` immediately when tasks are completed
   - generate `change-report.zh-CN.md` in the archived change directory
   - do not push

7. **Pause on defined safety conditions**

   Pause and ask the user when:
   - the request is too ambiguous to propose safely
   - proposal, design, or implementation reveals a material scope decision
   - validation cannot be repaired confidently
   - archiving would ignore meaningful unfinished work
   - committing would mix in unrelated changes

8. **Return to the main worktree and merge**

   After the linked worktree workflow succeeds:
   - return to the original main worktree
   - ensure you are on `<base_branch>`
   - inspect `git status --short`
   - pause if local changes on the base branch would be mixed into the merge

   Merge using:
   ```bash
   git merge --ff-only "<work_branch>"
   ```

   If fast-forward is not possible:
   - pause and report the divergence
   - do not auto-rebase
   - do not auto-create a merge commit
   - do not rewrite history without explicit approval

9. **Clean up the worktree and branch**

   After a successful merge:
   - remove the linked worktree with `git worktree remove "<worktree_path>"`
   - delete the temporary branch with `git branch -d "<work_branch>"`
   - run `git worktree prune`

   Cleanup rules:
   - if cleanup would require `--force`, pause and ask
   - if the worktree was manually deleted, use `git worktree prune` to clean stale metadata
   - never delete the main worktree

**Output During Execution**

```text
## OpenCat Work

**Change:** <name>
**Complexity:** simple|complex
**Base:** <base-branch>
**Worktree Branch:** <work-branch>
**Stage:** prepare|worktree|propose|validate|apply|archive|commit|merge|cleanup

<short progress note>
```

**Output On Completion**

```text
## OpenCat Work Complete

**Change:** <name>
**Base:** <base-branch>
**Worktree Branch:** <work-branch>
**Validation:** passed|failed
**Archive:** completed|not completed
**Chinese Report:** generated|not generated
**Commit:** succeeded|not created|failed
**Merge:** succeeded|paused
**Cleanup:** succeeded|paused

<remaining issues if any>
```

**Guardrails**
- Verify and bootstrap prerequisites before creating the worktree
- Create linked worktrees as sibling directories outside the repo root
- Do all risky edits inside the linked worktree, then merge from the main worktree
- Prefer `git merge --ff-only` for final integration
- Avoid `git worktree add/remove --force` unless the user explicitly approves
- Never auto-resolve conflicts, auto-rebase, or rewrite history without approval
- Never push unless the user explicitly asks
