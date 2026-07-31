# Operator actions

This file is updated by agents only when a human action is required.

Do not place secrets in this document.

| ID | Phase | Required action | Why | Status |
|---|---|---|---|---|
| OP-001 | Setup | Configure GitHub protection for `main` manually (see `docs/github-branch-protection.md`) | Automated script failed: `gh api` returned HTTP 400 `Problems parsing JSON` (PowerShell JSON payload / API schema). Do not force. Requires: required checks `governance` and `quality`, no direct pushes, PR required, no force push. | PENDING |
| OP-002 | 3A | Confirm Netlify authentication if unavailable | Preview deploy | PENDING |
| OP-003 | 3B | Provide Replicate token through secure environment | Real inference | PENDING |
| OP-004 | 3A | Provide Supabase remote credentials through secure environment | Remote persistence | PENDING |
