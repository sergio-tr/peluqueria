# Implementation plan

Orden obligatorio (24 fases). Antes de cada fase: objetivo, archivos, migraciones/endpoints, pruebas, AC. Después: lint, typecheck, tests, docs, resumen.

| # | Fase | Objetivo breve |
|---|------|----------------|
| 1 | Docs + ADR | Spec sin contradicciones |
| 2 | Scaffold Next | TS strict, Tailwind, shadcn, Motion, capas |
| 3 | Gate demo | Código acceso + cookie |
| 4 | Supabase | Migraciones, RLS, seed, btree_gist |
| 5 | Auth admin | Login profesional |
| 6 | Catálogo/assets | 8 estilos, atribución, catalog vs AI ref |
| 7 | Foto/consent/upload | Orden consent→upload, EXIF strip |
| 8 | Servicios/availability | Slots 15m, TZ Madrid↔UTC |
| 9 | Booking sin IA | Barba + hold sin try-on |
| 10 | HairTryOn + Mock | Abstracción + mock marcado |
| 11 | ReplicateQwen async | create prediction |
| 12 | Webhook + persist | Firma, idempotencia, Storage |
| 13 | UI generación | Polling backoff, comparador |
| 14 | Panel profesional | Lista/detalle |
| 15 | Propose TX + overlap | Exclusion + invalidar tokens |
| 16 | Demo Inbox + tokens | Mensajes + hash tokens |
| 17 | Confirm/decline | Idempotente + re-check slot |
| 18 | Expire | Scheduled + admin misma op |
| 19 | Retención/borrado | Purge + admin delete |
| 20 | Benchmark | 16→48, `ai-benchmark.md` |
| 21 | E2E Playwright | Mock en CI |
| 22 | Responsive/a11y | AA, reduced motion |
| 23 | Deploy Netlify | Env + cron + webhook |
| 24 | Smoke prod | Replicate real E2E DoD |

Rollback por fase: revert commit / flag off / migrate down / `AI_PROVIDER=mock` solo no-prod.

Detalle de archivos por fase se anota en commits y README al ejecutar.
