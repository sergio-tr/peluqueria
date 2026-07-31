# Production gap analysis — Peluquería Nowi

**Fecha:** 2026-07-31  
**Actualización:** alineado con decision-register ACCEPTED y recovery 1A–9  
**Ejecución:** código de mitigación en pila de ramas (PRs #1–#18); gaps P0/P1 **implementados en tip** salvo verificación en URL pública — ver `docs/autonomous-recovery-summary.md`
**Repo:** `c:\Users\Sergio\workspaces\peluqueria`  
**Fuente:** `docs/current-state-audit.md`

- **P0** — impide flujo productivo / DoD  
- **P1** — seguridad, privacidad, consistencia  
- **P2** — calidad / UX  
- **P3** — post-MVP  

**Retención correcta:** confirmada = **30 días después de la cita** (no 7).

**DoD notificación:** propuesta vía **Demo Inbox** durable (no correo Resend).

---

## P0 — Bloqueantes

| ID | Gap | Fase recovery |
|----|-----|---------------|
| P0-1 | Runtime `memoryDb`; sin store factory / Supabase runtime | 1A–1D |
| P0-2 | Sin deploy prod / URL verificada | 8 (preview en 3A) |
| P0-3 | Sin smoke Replicate real | 3B–3C + 9 |
| P0-4 | Output IA no en Storage propio | **3C** (no Fase 1) |
| P0-5 | Overlap solo memoria; exclusion PG no usada | 2B |
| P0-6 | Benchmark 48 no ejecutado (SVG no válidos) | 2D + 6 |
| P0-7 | Default `AI_PROVIDER=mock` | 3B fail-closed |
| P0-8 | DoD Inbox: inbox no durable en PG | 1D + 4 |

---

## P1 — Seguridad / privacidad / consistencia

| ID | Gap | Fase |
|----|-----|------|
| P1-1 | Auth admin clave estática `nowi-admin` | 2A |
| P1-2 | Tokens plaintext + lookup plaintext | 2C |
| P1-3 | Webhook sin secret omite verify fuera production | 3B |
| P1-4 | Sin dedupe webhook delivery id | 3B |
| P1-5 | Sin EXIF strip | 1C |
| P1-6 | Sin retención/purge (política 30d) | 5 |
| P1-7 | Fotos como data URLs | 1C |
| P1-8 | GET bookings con PII sin auth admin | 2A |
| P1-9 | RLS incompleta / no ejercitada | 1A–1D |
| P1-10 | Límites IA en memoria; sin alertas 70/90/100 | 3C |
| P1-11 | expire sin assertTransition / sin events | 2B–2C |
| P1-12 | Defaults inseguros en `.env.example` / docs | 1A, 2A |
| P1-13 | Seed `.jpg` vs assets `.svg` | 1B / 2D |
| P1-14 | Confirm idempotency incompleta vs D-08 | 2C |

---

## P2 — Calidad / experiencia

| ID | Gap | Fase |
|----|-----|------|
| P2-1 | Sin Playwright / CI | 7 |
| P2-2 | SVG placeholders inadecuados para smoke/benchmark | 2D |
| P2-3 | a11y / Motion unused / sin AA formal | 7 |
| P2-4 | Panel uso IA / alertas presupuesto | 3C |
| P2-5 | Retry job incompleto | 3C |
| P2-6 | Path docs `peluqueria-nowi` incorrecto | ops doc |
| P2-7 | Cron Netlify no demostrado | 3A / 8 |
| P2-8 | Cap mensual gens PENDING_BENCHMARK | 6 → D-04B |

---

## P3 — Post-MVP

| ID | Gap |
|----|-----|
| P3-1 | Resend / email real (explícitamente fuera — D-01) |
| P3-2 | Pin de versión modelo (solo post-benchmark ADR) |
| P3-3 | Modal / HairFastGAN |
| P3-4 | Festivos ES exhaustivos |
| P3-5 | Multi-staff / Calendar |

---

## Mapa gap → secuencia

| Fases | Gaps principales |
|-------|------------------|
| 1A–1D | P0-1, P1-5, P1-7, P1-9, P1-12, P1-13 |
| 2A–2C | P1-1, P1-2, P1-8, P1-11, P1-14, P0-5 |
| 2D | P2-2, parte P0-6 |
| 3A | preview HTTPS (prep P0-2/P0-3) |
| 3B–3C | P0-3, P0-4, P0-7, P1-3, P1-4, P1-10, P2-4, P2-5 |
| 4 | P0-8, D-01 |
| 5 | P1-6 (30d) |
| 6 | P0-6, P2-8 |
| 7 | P2-1, P2-3 |
| 8–9 | P0-2, DoD |

---

## Umbral “producción preparada”

**No alcanzado.** Requiere además:

1. Runtime ≠ memory  
2. `AI_PROVIDER=replicate-qwen` fail-closed  
3. Auth admin ≠ clave demo  
4. Overlaps en Postgres (estados D-07)  
5. Outputs en Storage (3C)  
6. Demo Inbox durable + confirm D-08  
7. Retención 30d post-cita  
8. Benchmark 48 go  
9. Smoke DoD en URL pública (Inbox, no email)
