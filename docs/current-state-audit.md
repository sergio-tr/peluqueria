# Current state audit — Peluquería Nowi

**Fecha de auditoría:** 2026-07-31  
**Última actualización documental:** 2026-07-31 (alineación con decision-register ACCEPTED; recovery plan **no** aprobado para código)  
**Repositorio auditado:** `c:\Users\Sergio\workspaces\peluqueria`  
**Package name:** `peluqueria-nowi`  

> **Nota de ruta:** `c:\Users\Sergio\workspaces\peluqueria-nowi` **no existe**. El código vive en `peluqueria`.

**Método:** contraste de código, tests, migraciones y config frente a especificación, ADRs, status/deployment docs, plan de recovery y DoD. Un ítem “Hecho” en un documento **no** se acepta como terminado sin evidencia.

**Estados:** `NOT_IMPLEMENTED` · `PARTIAL` · `LOCAL_ONLY` · `IMPLEMENTED_UNVERIFIED` · `VERIFIED`

**Política de retención aceptada (C-07):** DRAFT 24 h · no confirmada 7 d · confirmada **30 d post-cita** (no 7 d).

---

## Resumen de capas

| Capa | Evaluación |
|------|------------|
| Documentada | Alta (incl. decisiones ACCEPTED y recovery reestructurado) |
| Implementada (local) | Media — UI + APIs sobre `memoryDb` |
| Tests | Baja — 4 archivos Vitest |
| Infra real | Casi nula |
| Verificada en producción | Nula |

**Veredicto:** prototipo local. **No** MVP público verificable. Próxima implementación autorizable solo tras aprobar recovery: **Fase 1A**.

---

## Tabla de capacidades

| Capacidad | Requisito | Archivos implicados | Estado real | Tests existentes | Infra necesaria | Riesgo | Evidencia | Acción correctiva |
|-----------|-----------|---------------------|-------------|------------------|-----------------|--------|-----------|-------------------|
| Persistencia runtime | Supabase como fuente de verdad; fail-closed | Routes → `memoryDb`; `supabase/client.ts` sin uso en routes; `DATA_STORE` no leído | `LOCAL_ONLY` | Ninguno store | Supabase | P0 | 0 usos runtime PG | Fases 1A–1D |
| SupabaseStore / factory | Store factory tipada | — | `NOT_IMPLEMENTED` | — | — | P0 | Ausente | 1A |
| Migraciones SQL | Schema + seed | `supabase/migrations/20260730100000_init.sql`, seed | `IMPLEMENTED_UNVERIFIED` | No apply verificado | Supabase CLI | P1 | SQL existe | 1A apply + alinear seed |
| Datos maestros desde PG | salons/staff/services/hairstyles/rules | seed in-memory `seed-data.ts` en APIs | `LOCAL_ONLY` | availability domain | PG | P0 | APIs usan memory seed | 1B |
| Fotos + Storage + EXIF | Bucket privado, strip EXIF, signed URLs | `api/photos` guarda data URL memoria | `NOT_IMPLEMENTED` (Storage/EXIF) / `LOCAL_ONLY` (upload) | Ninguno | Storage | P1 | Sin sharp/EXIF | 1C |
| Persistencia operativa | ai_jobs, bookings, events, tokens, inbox | Solo Maps memoria; DDL SQL | `LOCAL_ONLY` | Ninguno | PG | P0 | Reinicio borra estado | 1D |
| Outputs Replicate→Storage | Copia binaria propia | Webhook guarda URL remota | `NOT_IMPLEMENTED` | Ninguno | Storage + Replicate | P0 | ADR-006 incumplido en código | **3C** (no Fase 1) |
| Exclusion overlap PG | GiST en estados D-07 | Constraint SQL; `memoryDb.overlaps` | `PARTIAL` | availability unit | PG | P0 | Constraint no ejercitada | 2B |
| State machine + events | Backend + booking_events | `booking-state.ts`; expire sin assert; events no escritos | `PARTIAL` | `booking-state.test.ts` | PG | P1 | — | 2B–2C |
| Admin Auth | Supabase Auth | `ADMIN_DEMO_KEY` / hardcode `nowi-admin` | `LOCAL_ONLY` | Ninguno | Auth | P1 | Client hardcode | 2A |
| Demo gate | Global, sin defaults, rate limit | Gate con defaults en example/docs | `LOCAL_ONLY` | demo-session tests | Env | P1 | Defaults documentados | 2A / D-03 |
| Tokens + confirm D-08 | Hash-only; idempotencia 200/404/410/409 | Plaintext en memory; idempotent parcial | `LOCAL_ONLY` | Ninguno | PG | P1 | `plaintextForDemo` | 2C |
| Caducidades D-07 | 24h / 12h / CONFIRMED permanente | Holds en memory expire | `LOCAL_ONLY` | Ninguno | Cron | P1 | Undeployed | 2C + 3A/8 |
| Demo Inbox durable | Postgres + NotificationPort | Inbox memory | `LOCAL_ONLY` | Ninguno | PG | P2→P0 DoD | D-01 ACCEPTED | 1D estructura + Fase 4 |
| Resend | Fuera MVP | — | `NOT_IMPLEMENTED` (correcto) | — | — | — | D-01 | No implementar |
| Replicate async + webhook | Firma, idempotencia delivery | Provider + webhook parcial | `IMPLEMENTED_UNVERIFIED` | Ninguno | Token + HTTPS | P0 | Sin smoke | 3A→3B |
| Límites IA durables | Session/daily/concurrent; alertas 70/90/100; budget 30€ | Counters memory; cap mensual fijo env | `LOCAL_ONLY` | Ninguno | PG | P1 | D-04B pending | 3C |
| Activos catálogo D-05 | Set generado + metadata | SVG placeholders | `PARTIAL` | Ninguno | — | P2/P0 smoke | SVG no válidos para benchmark | 2D |
| Benchmark | Smoke 16 gate; definitivo 48 | `ai-benchmark.md` vacío | `NOT_IMPLEMENTED` | — | Replicate | P0 declare-ready | — | Fase 6 |
| Retención 30d post-cita | Purge + admin delete | Docs antiguos decían 7d; código sin purge | `NOT_IMPLEMENTED` | — | Cron Storage | P1 | Sin jobs | Fase 5 |
| Playwright / CI / a11y | E2E mock CI | Sin playwright/CI | `NOT_IMPLEMENTED` | 4 unit files | GH Actions | P2 | — | Fase 7 |
| Deploy + DoD smoke | URL + Replicate real + Inbox | Sin deploy | `NOT_IMPLEMENTED` | — | Netlify | P0 | — | Fases 8–9 |
| RLS | Policies explícitas | RLS on; 3 SELECT; runtime service role unused | `PARTIAL` | — | Supabase | P1 | — | 1A–1D |
| Modal/HairFastGAN | No antes benchmark | Solo docs | `NOT_IMPLEMENTED` (correcto) | — | — | — | — | Mantener |

---

## Contradicciones documentales (históricas → corregidas en recovery/decisions)

| Antes | Ahora |
|-------|--------|
| Confirmada 7 d post-cita | **30 d** post-cita (C-07) |
| Recovery Fase 1 monolítica | 1A–1D |
| Resend posible en recovery | D-01: Inbox only |
| Cap 500 gens/mes fijo | D-04B PENDING_BENCHMARK |
| `migrate down` como rollback | ADR-015: prohibido genérico |

`implementation-status.md` sigue sobrestimando “Hecho” operativo — no reescrito en esta pasada (fuera de alcance de archivos de esta ejecución salvo los cuatro + ADRs).

---

## Tests inventariados

| Archivo | Ámbito |
|---------|--------|
| `src/domain/booking-state.test.ts` | Transiciones |
| `src/domain/availability.test.ts` | Slots |
| `src/domain/duration.test.ts` | Duración |
| `src/infrastructure/demo-session.test.ts` | Gate |

---

## Conclusión

Prototipo local. Decisiones de producto cerradas en `decision-register.md`. Recovery reestructurado pendiente de aprobación para código. **No** producción preparada mientras exista runtime memory.
