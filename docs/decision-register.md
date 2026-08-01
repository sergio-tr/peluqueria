# Decision register — Peluquería Nowi

**Fecha actualización:** 2026-07-31  
**Repo:** `c:\Users\Sergio\workspaces\peluqueria`  
**Nota:** Decisiones de producto cerradas abajo. El recovery plan actualizado **no** está aprobado aún para implementación de código.

---

## D-01 — Demo Inbox frente a Resend — ACCEPTED

| Campo | Valor |
|-------|--------|
| Decisión | Demo Inbox **durable en Postgres**. Resend **fuera** de este MVP. |
| DoD | El cliente recibe la propuesta en **Demo Inbox**, no por correo real. |
| Implementación posterior | `NotificationPort` + `DemoInboxNotificationAdapter`. |
| Estado | **ACCEPTED** |
| ADR | ADR-002 |

---

## D-02 — Modelo oficial sin pin — ACCEPTED

| Campo | Valor |
|-------|--------|
| Decisión | `qwen/qwen-image-edit-plus` sin pin obligatorio. |
| Persistencia por `ai_job` | provider; model owner; model name; requested version (nullable); reported version; prediction ID; prompt version; asset version; latencia; coste; estado. |
| Reevaluación | Pin solo tras benchmark, mediante ADR nuevo. |
| Estado | **ACCEPTED** |
| ADR | ADR-005 |

---

## D-03 — Gate global — ACCEPTED

| Campo | Valor |
|-------|--------|
| Decisión | Gate global para la demo. |
| Seguridad | Sin códigos ni secretos predeterminados. Cookie segura. Rate limiting de acceso. |
| Estado | **ACCEPTED** |
| ADR | ADR-003 |

---

## D-04A — Presupuesto mensual — ACCEPTED

| Campo | Valor |
|-------|--------|
| Decisión | Presupuesto máximo mensual: **30 €**. |
| Estado | **ACCEPTED** |

---

## D-04B — Cap de generaciones mensuales — PENDING_BENCHMARK

| Campo | Valor |
|-------|--------|
| Decisión | El máximo mensual de generaciones se calcula tras medir el **coste p95**. |
| Mientras tanto | 3 gens/sesión; 1 concurrente/sesión; límite diario configurable; kill switch; contadores durables; alertas 70 % / 90 % / 100 % del presupuesto. |
| Harness (Fase 6) | Script + hook `proposeD04bMonthlyCap` listos; propuesta numérica solo tras matriz 48 live con p95 medido. |
| Estado | **PENDING_BENCHMARK** (sin run live 48) |

---

## D-05 — Activos de catálogo — ACCEPTED

| Campo | Valor |
|-------|--------|
| Decisión | Set de imágenes **generado propio**. |
| Por hairstyle | `catalog_image`; `ai_reference_image`; `thumbnail`; `asset_version`; `provenance`; `usage_rights`. |
| Placeholders | Los SVG actuales **no** sirven para benchmark final ni smoke público. |
| Estado | **ACCEPTED** |
| ADR | ADR-008 |

---

## D-06 — Datos de negocio — ACCEPTED

| Campo | Valor |
|-------|--------|
| Decisión | Datos ficticios hasta cliente real autorizado. |
| Estado | **ACCEPTED** |

---

## D-07 — Bloqueo de agenda y caducidades — ACCEPTED

| Campo | Valor |
|-------|--------|
| Estados que bloquean | `PENDING_BARBER_REVIEW`; `PENDING_CUSTOMER_CONFIRMATION`; `CONFIRMED`. |
| Resto | No bloquean. |
| Caducidades | Review **24 h**; confirmación cliente **12 h**; `CONFIRMED` permanente hasta cancelación. |
| Liberación | Atómica con la transición de estado. |
| Estado | **ACCEPTED** |
| ADR | ADR-013 |

---

## D-08 — Confirmación idempotente — ACCEPTED

| Campo | Valor |
|-------|--------|
| Primer POST válido | Confirma; efectos una sola vez. |
| Repetición | **200** con booking confirmado. |
| No duplicar | `booking_events` ni notificación final. |
| Token desconocido | **404** |
| Token caducado/invalidado | **410** |
| Estado incompatible | **409** |
| Idempotencia notificación final | clave `booking-confirmed:{booking_id}` |
| Estado | **ACCEPTED** |
| ADR | ADR-014 |

---

## Decisiones de ingeniería ya cerradas

| ID | Decisión | Referencia |
|----|----------|------------|
| C-01 | Un salón, un profesional, ES, Europe/Madrid | assumptions |
| C-02 | Sin pagos / SMS / WhatsApp / app móvil | assumptions |
| C-03 | Prod exige Replicate real; mock no cuenta para DoD | ADR-009 |
| C-04 | No Background Function como flujo principal IA | ADR-004 |
| C-05 | No Modal/HairFastGAN antes de benchmark | recovery |
| C-06 | No declarar prod con runtime memory | auditoría |
| C-07 | Retención imágenes: draft 24h; no confirmada 7d; confirmada **30d post-cita** | ADR-012 |
| C-08 | Rollback: previous deploy / kill switches / forward migrations / expand-contract / backup — **no** `migrate down` genérico | ADR-015 |
| C-09 | Benchmark definitivo = 48 gens (6×8); smoke 16 solo gate temprano | ADR-016 |

---

## Cómo reabrir

Solo con ADR nuevo y actualización de este registro. No cerrar decisiones en silencio durante implementación.
