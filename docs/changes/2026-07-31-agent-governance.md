# Change record — agent governance package

**Date:** 2026-07-31  
**Branch:** `chore/agent-governance`  
**Pull request:** pending  
**Recovery phase:** `0` (governance / setup)  
**Status:** IN_PROGRESS

## Summary

Install and activate the agent governance package: Cursor rules/agents/skills/hooks, versioned Git hooks, GitHub PR template and governance workflow, and operational documentation. No recovery feature implementation.

## Recovery phase

Phase 0 / setup — governance only. Does not implement recovery phases 1A–9.

## Scope included

- `.cursor/**` (rules, agents, skills, hooks, scripts, prompts)
- `.githooks/**` (includes `prepare-commit-msg` to strip automated tool co-author trailers before validation)
- `.github/pull_request_template.md`
- `.github/workflows/governance.yml`
- `AGENTS.md`, `.cursorignore`, `.cursorindexingignore`
- Operational docs: `INSTALL.md`, `MANIFEST.md`, `FILE_INVENTORY.md`, `docs/agent-operations.md`, `docs/git-workflow.md`, `docs/github-branch-protection.md`, `docs/operator-actions.md`, `docs/agent-runs/`, `docs/changes/`
- README pointer to agent governance
- This change record

## Scope excluded

- Application/feature code and recovery phases 1A–9
- Product docs outside the governance package (audit/recovery already untracked remain local WIP)
- Merging or closing the PR
- Implementing `.cursor` beyond the provided package

## Architecture impact

None on runtime architecture. Adds deterministic process controls for Git and PR quality.

## API impact

None.

## Data and migration impact

None.

## Security and privacy impact

- Blocks direct commits to `main` when `origin/main` exists
- Rejects tool attribution in commit messages
- Documents remote branch protection; may require operator action if API configure fails
- `.cursorignore` excludes secrets and generated outputs from agent context

## Testing evidence

| Check | Command | Result |
|------|---------|--------|
| Branch valid | `node .cursor/scripts/validate-branch-name.mjs chore/agent-governance` | PASS |
| Branch invalid | `node .cursor/scripts/validate-branch-name.mjs InvalidBranch` | PASS (rejected) |
| Commit message | `validate-commit-message.mjs --text "chore(governance): add agent workflow controls"` | PASS |
| Forbidden attribution | message containing tool name | PASS (rejected) |
| Main guard | `guard-current-branch.mjs` on `main` | PASS (blocked) |
| Docs gate fixture | temp non-docs commit without change record | PASS (rejected); fixture removed |
| Branch protection script | `.cursor/scripts/configure-github-main-protection.ps1` then manual `gh api` JSON | PASS — protection enabled on `origin/main` (script JSON fixed for UTF-8 no BOM) |
| Lint | | NOT_RUN (app toolchain out of scope) |
| Typecheck | | NOT_RUN |
| Tests | | NOT_RUN |
| Build | | NOT_RUN |

## Deployment and rollback

- Rollback: previous Netlify deploy N/A; revert/close PR; `git config --unset core.hooksPath` locally if needed
- No `migrate down`
- Remote protection via script or manual operator steps in `docs/operator-actions.md`

## Documentation updated

- `AGENTS.md`, `docs/agent-operations.md`, `docs/git-workflow.md`, `docs/github-branch-protection.md`, `docs/operator-actions.md`
- `INSTALL.md`, `MANIFEST.md`, `FILE_INVENTORY.md`
- `README.md` (governance pointer)
- `docs/changes/2026-07-31-agent-governance.md` (this file)

## Remaining risks

- GitHub branch protection API may be unavailable (plan/permissions); operator action required
- CI `quality` job may fail on current `main` Next lint script until app toolchain is normalized in a later PR
- Local WIP tracked modifications were at risk during docs-gate fixture cleanup; untracked MVP files remain on disk

## Verification status

- Planner: governance install only
- Architect: N/A
- Security: hooks and ignore patterns reviewed
- Tests: validators exercised manually
- Independent verifier: pending PR review
