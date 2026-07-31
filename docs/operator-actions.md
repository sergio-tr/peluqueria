# Operator actions

This file is updated by agents only when a human action is required.

Do not place secrets in this document.

| ID | Phase | Required action | Why | Status |
|---|---|---|---|---|
| OP-001 | Setup | Configure GitHub protection for `main` | Applied 2026-07-31 via `gh api` (required checks `governance` + `quality`, enforce admins, no force push, conversation resolution). Package script still needs UTF-8 JSON without BOM for reuse. | DONE |
| OP-002 | 3A | Confirm Netlify authentication if unavailable | Preview deploy | PENDING |
| OP-003 | 3B | Provide Replicate token through secure environment | Real inference | PENDING |
| OP-004 | 3A | Provide Supabase remote credentials through secure environment | Remote persistence | PENDING |
