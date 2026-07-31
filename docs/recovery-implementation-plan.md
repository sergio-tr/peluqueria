# Recovery implementation plan — Peluquería Nowi

**Fecha:** 2026-07-31 (revisión post-auditoría)  
**Repo:** `c:\Users\Sergio\workspaces\peluqueria`  
**Estado del plan:** documentado y alineado con decisiones ACCEPTED — **aún no aprobado para implementación de código**.

**Reglas:**
- No `DATA_STORE=memory` en producción.
- No `MockHairProvider` en producción.
- No auth admin por clave estática demo.
- No copiar outputs Replicate a Storage en Fase 1 (eso es Fase 3C).
- No Modal/HairFastGAN antes del benchmark (Fase 6).
- Rollback: previous deploy · kill switches · forward corrective migrations · expand/contract · backup previo a destructivas. **Prohibido** `migrate down` como estrategia genérica.

**Retención de imágenes (C-07 / ADR-012):**
- DRAFT: 24 h  
- Solicitud no confirmada: 7 días  
- Cita confirmada: **30 días después de la cita**

---

## Secuencia

| # | Fase | Nombre |
|---|------|--------|
| 0 | — | Decisiones y documentación |
| 1A | Persistencia | Fundación de persistencia |
| 1B | Persistencia | Datos maestros y disponibilidad |
| 1C | Persistencia | Fotografías seguras y Storage |
| 1D | Persistencia | Persistencia operativa |
| 2A | Reservas | Auth y protección API |
| 2B | Reservas | Transacciones, exclusión y estados |
| 2C | Reservas | Tokens, confirmación y expiración |
| 2D | Activos | Activos definitivos del catálogo |
| 3A | IA remota | Bootstrap remoto (preview) |
| 3B | IA remota | Replicate predictions y webhook |
| 3C | IA remota | Outputs a Storage, retry y límites |
| 4 | Notificaciones | NotificationPort y Demo Inbox durable |
| 5 | Privacidad | Retención, borrado y logging |
| 6 | Calidad | Benchmark (smoke 16 gate → 48 definitivo) |
| 7 | Calidad | Playwright, CI, a11y y responsive |
| 8 | Release | Deploy productivo |
| 9 | Release | Smoke DoD |

**Siguiente fase a implementar cuando se apruebe el plan:** **1A**.

---

## Fase 0 — Decisiones y documentación

### Objetivo
Cerrar decisiones de producto y alinear docs/ADRs antes de código.

### Alcance exacto
Actualizar decision-register, recovery plan, audit/gaps, ADRs necesarios.

### Archivos previstos
`docs/decision-register.md`, `docs/recovery-implementation-plan.md`, `docs/current-state-audit.md`, `docs/production-gap-analysis.md`, `docs/adr/*`

### Migraciones / endpoints / tests
Ninguno.

### Criterios de aceptación
- [ ] D-01…D-08 y C-07…C-09 reflejados
- [ ] Retención 30d post-cita sin contradicciones en estos docs
- [ ] Secuencia 1A–9 publicada

### Riesgos
Drift si se implementa sin aprobar el plan.

### Rollback
N/A (documental).

### Dependencias
Ninguna.

### Exclusiones
Cualquier cambio de código de aplicación.

---

## Fase 1A — Fundación de persistencia

### Objetivo
Base tipada fail-closed para Supabase; factory de store; migraciones y seed reproducibles; eliminar defaults inseguros de env de ejemplo.

### Alcance exacto
Config tipada; validación fail-closed en prod; `StoreFactory`; cliente Supabase **server-only**; migraciones + seed; quitar defaults `nowi-demo` / `nowi-admin` / secrets `change-me` como valores operativos documentados.

### Archivos previstos
- `src/infrastructure/config/*`
- `src/infrastructure/supabase/client.ts` (server-only)
- `src/infrastructure/persistence/store-factory.ts`
- `supabase/migrations/*`, `supabase/seed/*`
- `.env.example` (placeholders vacíos + comentarios; sin códigos reales)

### Migraciones
Revisar/aplicar schema base existente; asegurar extensiones `btree_gist`, `pgcrypto`.

### Endpoints
Ninguno nuevo de negocio.

### Tests
- Config: falla sin vars en modo prod
- Factory: selecciona store según config; prod rechaza memory

### Criterios de aceptación
- [ ] Prod sin Supabase → error claro (fail-closed)
- [ ] Memory solo local/test explícito
- [ ] `supabase db reset` (o equivalente documentado) + seed idempotente
- [ ] Sin secretos/códigos predeterminados en `.env.example`

### Riesgos
Bloqueo sin cuenta Supabase.

### Rollback
Previous commit docs/config; no migrate down.

### Dependencias
Fase 0.

### Exclusiones
Lectura de maestros en APIs; upload fotos; ai_jobs/bookings; outputs Replicate; Auth UI.

---

## Fase 1B — Datos maestros y disponibilidad

### Objetivo
Leer catálogo operativo desde Postgres: salons, staff, services, hairstyles, availability_rules, blocked_periods.

### Alcance exacto
Repositorios + mappers; APIs GET services/hairstyles/availability contra Postgres; seed con datos ficticios (D-06).

### Archivos previstos
- `src/infrastructure/persistence/repositories/{salons,staff,services,hairstyles,availability}*`
- `src/app/api/services/route.ts`, `hairstyles/route.ts`, `availability/route.ts`
- Seed SQL

### Migraciones
Ajustes menores de columnas si faltan (p. ej. campos asset preparados nullable).

### Endpoints
`GET /api/services`, `GET /api/hairstyles`, `GET /api/availability`

### Tests
Repositorio + mappers; availability con reglas seed.

### Criterios de aceptación
- [ ] Tras seed, APIs no dependen de `SEED_*` in-memory
- [ ] Availability interpreta Europe/Madrid; UTC en DB

### Riesgos
Seed paths vs assets placeholder.

### Rollback
Previous deploy; forward fix seed.

### Dependencias
1A.

### Exclusiones
Upload; bookings writes; AI; assets definitivos (2D).

---

## Fase 1C — Fotografías seguras y Storage privado

### Objetivo
Pipeline de foto: validación por contenido, límites, normalización, **EXIF strip antes de persistir**, bucket privado, paths en DB, signed URLs breves.

### Alcance exacto
Bucket photos; `POST /api/photos` post-consent; sin data URLs persistentes como fuente de verdad.

### Archivos previstos
- `src/application/photos/*`, `src/infrastructure/storage/*`
- `src/app/api/photos/route.ts`
- Migración/policies Storage

### Migraciones
Bucket privado + policies; tabla `photos` alineada.

### Endpoints
`POST /api/photos` (y GET preview firmado si aplica, TTL corto)

### Tests
Mime spoof reject; oversize; dimensiones; EXIF eliminado en fixture.

### Criterios de aceptación
- [ ] Consent obligatorio antes de upload
- [ ] Objeto privado; preview solo signed URL breve
- [ ] EXIF strip verificado

### Riesgos
Librería imagen en serverless.

### Rollback
Kill switch upload; previous deploy.

### Dependencias
1A (1B recomendado).

### Exclusiones
Copia de outputs Replicate (3C); retención/purge completa (Fase 5 — aquí solo persistir correctamente).

---

## Fase 1D — Persistencia operativa

### Objetivo
Persistir ai_jobs, booking_requests, booking_events, confirmation_tokens, demo_inbox_messages en Postgres; eliminar imports directos de `memoryDb` en routes de negocio.

### Alcance exacto
CRUD/repos para esas entidades; prueba de supervivencia tras reinicio de proceso. Estructura de columnas de resultado IA puede existir (path nullable); **no** implementar descarga desde Replicate.

### Archivos previstos
- Repos booking/ai/tokens/inbox/events
- Routes que hoy importan `memoryDb`
- Retirar o aislar `memoryDb` a tests

### Migraciones
Forward fixes a tablas existentes; índices.

### Endpoints
Mismos contratos booking/admin/confirm/ai jobs (lectura/escritura DB).

### Tests
Crear booking → reiniciar app (o nueva instancia) → booking sigue; events append.

### Criterios de aceptación
- [ ] Cero imports de `memoryDb` en `src/app/api/**` de producción
- [ ] Persistencia verificada tras reinicio
- [ ] `result_image_path` puede ser null hasta 3C

### Riesgos
Regresión UI local.

### Rollback
Previous deploy; feature flag solo non-prod memory **si** aún existe para tests.

### Dependencias
1A–1C.

### Exclusiones
TX exclusion dura (2B); Auth real (2A); webhook Replicate (3B); copy output (3C).

---

## Fase 2A — Auth y protección API

### Objetivo
Supabase Auth para admin; eliminar `ADMIN_DEMO_KEY` / hardcode; gate global sin defaults; rate limit acceso demo.

### Alcance exacto
Login admin; middleware/API guards; cookie demo segura; rate limit gate.

### Archivos previstos
- `src/app/admin/login/*`, session helpers
- Admin API auth
- `middleware.ts`, demo-access
- `.env.example`

### Migraciones
Link `staff.auth_user_id`.

### Endpoints
Auth session admin; admin routes requieren sesión.

### Tests
401 sin auth; gate sin default code en config.

### Criterios de aceptación
- [ ] No clave estática demo como auth profesional
- [ ] Gate sin códigos predeterminados en repo
- [ ] Rate limiting documentado y testeado

### Riesgos
Lockout demo.

### Rollback
Previous deploy.

### Dependencias
1D.

### Exclusiones
Lógica de propose/confirm (2B/2C).

---

## Fase 2B — Transacciones, exclusión y estados

### Objetivo
Overlaps vía exclusion Postgres; transiciones validadas; estados bloqueantes según D-07; `booking_events` en cada transición; liberación atómica con transición.

### Alcance exacto
Propose/reject/create booking en TX; constraint ejercitada.

### Archivos previstos
- Use-cases booking; domain state machine
- Migración constraint si hace falta forward-fix

### Migraciones
Forward corrective si exclusion incompleta.

### Endpoints
`POST /api/booking-requests`, admin transition

### Tests
Doble reserva mismo slot → un éxito / un 409; estados no bloqueantes no ocupan.

### Criterios de aceptación
- [ ] Solo PENDING_BARBER_REVIEW, PENDING_CUSTOMER_CONFIRMATION, CONFIRMED bloquean
- [ ] Liberación atómica al salir de bloqueo
- [ ] Events escritos

### Riesgos
DST / rangos.

### Rollback
Previous deploy; forward fix SQL.

### Dependencias
2A, 1D.

### Exclusiones
Tokens confirm (2C).

---

## Fase 2C — Tokens, confirmación y expiración

### Objetivo
Tokens solo-hash; confirmación idempotente D-08; caducidades 24h/12h; expire cron + admin misma op; clave notificación `booking-confirmed:{booking_id}`.

### Alcance exacto
Confirm/decline; invalidate on new propose; scheduled expire.

### Archivos previstos
- confirm routes; expire use-case; netlify scheduled fn
- notification idempotency store (prep Fase 4)

### Migraciones
Tokens sin plaintext; tabla idempotency keys si aplica.

### Endpoints
`GET/POST confirm`, cron expire, admin expire-due

### Tests
Idempotent 200; 404/410/409; no double events; expire libera slot

### Criterios de aceptación
- [ ] Cumple D-08 al pie de la letra
- [ ] CONFIRMED no caduca solo
- [ ] Misma op dominio cron y admin

### Riesgos
Clock skew.

### Rollback
Kill switch cron; previous deploy.

### Dependencias
2B.

### Exclusiones
Envío email; NotificationPort completo (Fase 4 — puede dejar hook).

---

## Fase 2D — Activos definitivos

### Objetivo
Sustituir SVG placeholder por set generado propio (D-05) con provenance y usage_rights; no usar SVG en benchmark/smoke público.

### Alcance exacto
Generar/cargar catalog, ai_reference, thumbnail; `asset_version`; actualizar seed y `assets-attribution.md`.

### Archivos previstos
- `public/` o Storage hairstyles
- seed; attribution doc
- schema columns asset_* 

### Migraciones
Columnas hairstyles según D-05.

### Endpoints
GET hairstyles sirve nuevos assets.

### Tests
Cada estilo tiene tres imágenes + metadata.

### Criterios de aceptación
- [ ] SVG no usados como ref IA de smoke/benchmark
- [ ] Attribution completa

### Riesgos
Homogeneidad visual.

### Rollback
Previous asset_version.

### Dependencias
1B; antes de Fase 6 y smoke 9.

### Exclusiones
Benchmark ejecución (Fase 6).

---

## Fase 3A — Bootstrap remoto

### Objetivo
Infra mínima HTTPS para webhook **sin** lanzamiento productivo final.

### Alcance exacto
Proyecto Supabase remoto; site Netlify; **preview** deploy protegido; env preview; URL HTTPS; secrets; health checks.

### Archivos previstos
- `docs/deployment.md` (runbook preview)
- netlify/supabase project linking (ops)

### Migraciones
Aplicar schema en proyecto remoto.

### Endpoints
Health: p. ej. gate + `GET /api/services`

### Tests
Health checklist manual documentada.

### Criterios de aceptación
- [ ] Preview URL HTTPS estable
- [ ] Secrets en Netlify preview (sin defaults)
- [ ] Gate activo en preview
- [ ] **No** es release productivo (Fase 8)

### Riesgos
Coste Free tier; secret leakage.

### Rollback
Unpublish preview; rotate secrets.

### Dependencias
1D mínimo; 2A recomendado.

### Exclusiones
Webhook funcional completo (3B); copy Storage (3C); dominio prod final.

---

## Fase 3B — Replicate predictions y webhook

### Objetivo
Crear predictions async; webhook firmado idempotente; actualizar `ai_jobs` (campos D-02); **sin** depender aún de copia local del binario (path resultado puede quedar pendiente hasta 3C si se acuerda URL temporal interna solo server-side — preferible marcar RUNNING hasta 3C complete).

### Alcance exacto
Provider Replicate; webhook verify + dedupe delivery; map prediction→job; fail-closed sin mock en preview/prod.

### Archivos previstos
- AI provider, jobs route, webhook route
- `webhook_deliveries` table

### Migraciones
`webhook_deliveries`; columnas ai_jobs D-02.

### Endpoints
`POST /api/ai/jobs`, `GET .../[jobId]`, `POST /api/webhooks/replicate`

### Tests
Firma; skew; duplicate delivery; terminal ignore.

### Criterios de aceptación
- [ ] Prod/preview: `replicate-qwen` o 503
- [ ] Nunca mock silencioso
- [ ] Job metadata D-02 persistida

### Riesgos
Webhook URL mal configurada.

### Rollback
`AI_GENERATION_ENABLED=false`; previous deploy.

### Dependencias
3A, 1D.

### Exclusiones
Download output → Storage (3C); rate limit presupuesto completo (3C).

---

## Fase 3C — Outputs, retry y límites

### Objetivo
Descargar output Replicate → Storage privado; retry; rate limits durables; alertas 70/90/100 % presupuesto (D-04A/B).

### Alcance exacto
Persist `result_image_path`; signed preview; retry endpoint real; counters PG; kill switch.

### Archivos previstos
- webhook success path Storage
- retry route
- admin ai-usage
- counters repo

### Migraciones
Counters; alert thresholds config.

### Endpoints
webhook (complete), retry, admin usage

### Tests
Output en bucket; retry respeta límites; alert hooks/log

### Criterios de aceptación
- [ ] UI no depende de URL Replicate efímera
- [ ] Límites session/daily/concurrent durables
- [ ] Cap mensual numérico sigue PENDING_BENCHMARK (D-04B) pero presupuesto € y alertas activos

### Riesgos
Coste; fallos download.

### Rollback
Kill switch generación; previous deploy.

### Dependencias
3B.

### Exclusiones
Benchmark formal (Fase 6); Modal.

---

## Fase 4 — NotificationPort y Demo Inbox

### Objetivo
`NotificationPort` + `DemoInboxNotificationAdapter`; mensajes durables; idempotencia `booking-confirmed:{booking_id}`.

### Alcance exacto
Sin Resend (D-01).

### Archivos previstos
- `src/domain/notifications/*`
- adapters; propose/confirm hooks
- admin inbox UI contra DB

### Migraciones
Inbox + idempotency keys.

### Endpoints
`GET /api/admin/demo-inbox`

### Tests
No duplicar notificación final; propose crea mensaje.

### Criterios de aceptación
- [ ] DoD: cliente ve propuesta en Demo Inbox
- [ ] Port desacoplado de Resend

### Riesgos
Ninguno de email.

### Rollback
Previous deploy.

### Dependencias
2C, 1D.

### Exclusiones
Resend.

---

## Fase 5 — Retención, borrado y logging

### Objetivo
Purge según ADR-012 (24h / 7d / **30d post-cita**); borrado admin; logs estructurados sin PII ni signed URLs.

### Archivos previstos
- purge job; admin delete photo
- logging redaction

### Migraciones
Campos retención si faltan.

### Endpoints
Admin delete; cron purge

### Tests
Plazos; no borrar confirmada antes de 30d post-cita.

### Criterios de aceptación
- [ ] Política 30d correcta
- [ ] Borrado manual
- [ ] Logs redactados

### Riesgos
Borrado prematuro.

### Rollback
Disable purge cron; previous deploy.

### Dependencias
1C, 1D, 2C.

### Exclusiones
Cambio de política de negocio.

---

## Fase 6 — Benchmark

### Objetivo
Gate temprano **16** generaciones; benchmark definitivo **6 fotos × 8 cortes = 48**; pesos 30/25/20/10/10/5; ≥80 % enseñables; documentar `ai-benchmark.md`.

### Alcance exacto
Fixtures fuera de Git; assets de 2D; sin SVG placeholder.

### Archivos previstos
`docs/ai-benchmark.md`; script opcional

### Migraciones
Ninguna.

### Endpoints
Jobs reales o script.

### Tests
Checklist cualitativo documentado.

### Criterios de aceptación
- [ ] Smoke 16 pasa (gate)
- [ ] Matriz 48 completada y puntuada
- [ ] Conclusión go/no-go; pin solo vía ADR si no-go

### Riesgos
Presupuesto 30 €.

### Rollback
N/A documental.

### Dependencias
2D, 3C.

### Exclusiones
Implementar Modal/HairFastGAN.

---

## Fase 7 — Playwright, CI, a11y, responsive

### Objetivo
E2E mock en CI; a11y AA flujo principal; responsive.

### Archivos previstos
`e2e/**`, `playwright.config.*`, `.github/workflows/ci.yml`

### Migraciones
Ninguna.

### Endpoints
App local/CI.

### Tests
Flujo feliz mock + axe smoke.

### Criterios de aceptación
- [ ] CI verde
- [ ] Badge Demostración en mock

### Riesgos
Flaky.

### Rollback
Quarantine job CI.

### Dependencias
2C, 4 (flujo completo).

### Exclusiones
E2E contra Replicate real (coste).

---

## Fase 8 — Deploy productivo

### Objetivo
Release Netlify prod (no preview); env fail-closed; cron; webhook prod URL.

### Archivos previstos
Runbook deployment; netlify prod

### Criterios de aceptación
- [ ] `AI_PROVIDER=replicate-qwen`
- [ ] Sin memory runtime
- [ ] Gate sin defaults
- [ ] Cron horario

### Rollback
Previous deploy Netlify; kill switches.

### Dependencias
5–7; benchmark go (6).

### Exclusiones
Smoke DoD (Fase 9).

---

## Fase 9 — Smoke DoD

### Objetivo
Flujo completo en URL pública con Replicate real; cliente confirma vía **Demo Inbox** (no email).

### Criterios de aceptación
Acceso → foto → corte → gen real → solicitud → revisión → propuesta → **Demo Inbox** → confirm → agenda bloqueada → solape rechazado.

### Rollback
`AI_GENERATION_ENABLED=false` si incidente.

### Dependencias
8 + 6 go.

### Exclusiones
Declarar éxito sin evidencia fechada.

---

## Política de rollback (global)

| Permitido | Prohibido |
|-----------|-----------|
| Previous Netlify deploy | `migrate down` genérico |
| Kill switches (`AI_GENERATION_ENABLED`, upload flags) | Borrar datos prod sin backup |
| Forward corrective migrations | Expand/contract invertido destructivo sin backup |
| Expand/contract schema | — |
| Backup previo a ops destructivas | — |
