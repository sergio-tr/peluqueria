# Production DoD smoke checklist — Phase 9

**Recovery phase:** 9 — Smoke DoD  
**DoD status:** **NOT VERIFIED**  
**Last updated:** 2026-07-31

This checklist documents the mandatory end-to-end smoke on a **public production URL** with **Replicate real** (no mock). It does **not** declare production live until every step has dated evidence and an operator attestation.

**Prerequisites (Phase 8):** OP-013 through OP-016 complete — production env, deploy, Replicate webhook, health checks. See `docs/deployment.md` and `docs/operator-actions.md`.

**Rollback during smoke:** set `AI_GENERATION_ENABLED=false` in Netlify Production env if AI incident (ADR-015).

---

## Evidence policy

| Field | Rule |
|-------|------|
| Production URL | HTTPS host used for the run (no trailing slash) |
| Timestamp | ISO-8601 UTC when step was verified |
| Screenshot path | Relative path under `smoke-evidence/` (gitignored) — **no PII in Git** |
| Internal IDs | Booking ID, job ID, inbox message ID — **no customer name, email, or photo content** |
| DoD status | Remains `NOT_VERIFIED` until operator completes OP-017 and all steps pass |

Initialize a run record:

```bash
npm run smoke:dod -- --init
# writes smoke-evidence/dod-smoke-<runId>.json from template (PENDING fields)
```

Validate a completed record (fails while any step is PENDING):

```bash
npm run smoke:dod -- --validate smoke-evidence/dod-smoke-<runId>.json
```

---

## Preflight (OP-016)

Complete before starting the customer flow.

| # | Check | Expected | Status | Timestamp | Evidence |
|---|-------|----------|--------|-----------|----------|
| P1 | `GET /api/health` | `200` `{ "ok": true }` | PENDING | PENDING | PENDING |
| P2 | Gate API without cookie | `401` on `/api/services` | PENDING | PENDING | PENDING |
| P3 | Cron expire auth | `200` with valid `CRON_SECRET` | PENDING | PENDING | PENDING |
| P4 | Replicate webhook URL | Production `/api/webhooks/replicate` registered | PENDING | PENDING | PENDING |
| P5 | `AI_PROVIDER=replicate-qwen` | No mock badge anywhere on prod | PENDING | PENDING | PENDING |

**Production URL:** PENDING  
**Git commit (deploy):** PENDING  
**Run ID:** PENDING

---

## DoD flow (recovery plan Fase 9)

Sequence: **Acceso → foto → corte → gen real → solicitud → revisión → propuesta → Demo Inbox → confirm → agenda bloqueada → solape rechazado**.

| Step | ID | Action | Pass criteria | Status | Timestamp | Screenshot | Internal IDs |
|------|-----|--------|---------------|--------|-----------|------------|--------------|
| 1 | `01-acceso` | Open `/acceso`, enter valid `DEMO_ACCESS_CODE` | Redirect to app; `/api/services` returns `200` with cookie | PENDING | PENDING | PENDING | PENDING |
| 2 | `02-foto` | `/probar` → upload or capture photo → crop | Photo step completes; consent screen shown | PENDING | PENDING | PENDING | `photoId`: PENDING |
| 3 | `02b-consent` | Accept privacy checkboxes → upload | Photo stored; proceed to style picker | PENDING | PENDING | PENDING | PENDING |
| 4 | `03-corte` | Select a hairstyle (e.g. Low fade) | Style selected; generate enabled | PENDING | PENDING | PENDING | `hairstyleId`: PENDING |
| 5 | `04-gen-real` | Click **Generar vista previa**; wait for job | Job completes via Replicate webhook; **no** “Demostración — resultado mock” badge; `resultPreviewUrl` from Storage | PENDING | PENDING | PENDING | `aiJobId`: PENDING |
| 6 | `05-solicitud` | **Adjuntar y reservar** → complete booking form | Booking request created; confirmation page with request ID | PENDING | PENDING | PENDING | `bookingId`: PENDING |
| 7 | `06-revision` | Admin login → `/admin` → open request | Detail shows source + result previews; status reviewable | PENDING | PENDING | PENDING | PENDING |
| 8 | `07-propuesta` | Admin **Proponer** (or approve) with duration/comment | API success; proposal state persisted | PENDING | PENDING | PENDING | PENDING |
| 9 | `08-demo-inbox` | Refresh Demo Inbox panel | Message with confirm link; **not** real email (D-01) | PENDING | PENDING | PENDING | `inboxMessageId`: PENDING |
| 10 | `09-confirm` | Open confirm link (separate session/incognito) → **Confirmar cita** | Booking confirmed; success UI | PENDING | PENDING | PENDING | `confirmToken`: redacted hash only |
| 11 | `10-agenda-bloqueada` | Admin agenda / booking list | Confirmed slot shows blocked; no double-book on same barber/time | PENDING | PENDING | PENDING | `slotStart`: PENDING |
| 12 | `11-solape-rechazado` | Submit second request overlapping confirmed slot | Overlap rejected (API/UI error); slot unchanged | PENDING | PENDING | PENDING | `overlapBookingId`: PENDING |

---

## Operator attestation

| Field | Value |
|-------|-------|
| Operator | PENDING |
| Completed at (UTC) | PENDING |
| Evidence file | PENDING |
| DoD status | **NOT VERIFIED** |
| Notes | PENDING |

Do **not** set DoD to VERIFIED without completing all 12 flow steps + preflight on the recorded production URL.

---

## Related docs

- Acceptance criteria: `docs/acceptance-criteria.md`
- Testing strategy (smoke prod): `docs/testing-strategy.md`
- Operator runbook: OP-017 in `docs/operator-actions.md`
- Recovery plan Fase 9: `docs/recovery-implementation-plan.md`
