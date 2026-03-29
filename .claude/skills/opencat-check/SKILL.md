---
name: opencat-check
description: Verify and bootstrap the local OpenCat/OpenSpec toolchain: check git, node, npm, OpenSpec CLI, and repository dependencies, then install or bootstrap what is missing. Use before `opencat-task`, when OpenSpec tooling fails to start, or when the user asks for environment checking, installation, or prerequisite repair.
license: MIT
compatibility: Requires shell access and permission to install missing tools when needed.
metadata:
  author: opencat
  version: "1.0"
---

Run environment checks and safe bootstrap steps before OpenCat workflows.

Use it when the user wants:
- prerequisite checking before `opencat-task`
- missing tool installation for OpenSpec workflows
- environment repair for git, node/npm, or OpenSpec CLI

---

**Input**: The current repository root, or the repository the user wants to prepare.

## Workflow

1. **Inspect repository context**

   - verify the target directory is the intended repository
   - detect the preferred package manager from lockfiles
   - in this repository, default to `npm` because `package-lock.json` is present

2. **Verify required tools in order**

   Check:
   1. `git --version`
   2. `node --version`
   3. `npm --version`
   4. `openspec --version`
   5. if `openspec` is not on `PATH`, `npx openspec@latest --version`

3. **Verify repository dependencies**

   - if repository dependencies are missing and `package-lock.json` exists, run `npm install`
   - if dependency installation is already complete, do not reinstall just to be safe

4. **Bootstrap missing prerequisites**

   If something is missing, fix it before continuing:
   - if `git` is missing, install it with the host OS package manager when available, then re-check `git --version`
   - if `node` or `npm` is missing, install Node.js LTS first, then re-check both commands
   - if OpenSpec is missing, prefer the no-global path first with `npx openspec@latest --version`
   - if a persistent OpenSpec install is still needed, install the official CLI package with `npm install -g @fission-ai/openspec@latest`, then verify `openspec --version`

5. **Verify after every fix**

   - re-run the failing check immediately after each install or bootstrap step
   - do not report success while any prerequisite is still missing or unusable

6. **Summarize readiness**

   Report:
   - which tools were already available
   - which tools or dependencies were installed during this run
   - whether the environment is ready for `opencat-task`
   - any blockers that still require user action

## Guardrails

- Prefer the repository's existing package manager instead of inventing a new one
- Install only what is needed to satisfy the workflow
- Do not continue into `opencat-task` while prerequisites are still missing
- If installation requires elevated privileges, network approval, or an OS-specific choice the agent cannot complete safely, pause and ask the user
- Verify every install immediately after it completes
