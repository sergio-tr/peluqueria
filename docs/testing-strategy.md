# Testing strategy

## Unit (Vitest)

- State machine transitions
- Duration formula
- Overlap domain rules
- Provider mock
- Webhook signature verification (fixtures)
- IP hash + counter race (where feasible)
- Zod schemas

## Integration

- API handlers con Supabase test/local o mocks de infra
- TX propose/confirm (overlap reject)

## E2E (Playwright)

- `AI_PROVIDER=mock` obligatorio en CI
- Flujo smoke: gate → foto fixture → corte → job mock → badge **Demostración**
- APIs de try-on interceptadas en Playwright (sin Supabase/Replicate en CI)
- axe-core WCAG 2.1 AA en gate, privacidad y paso compare
- Viewports desktop (`Desktop Chrome`) y mobile (`Pixel 5`)
- Workflow `.github/workflows/ci.yml` job `e2e`; `quality` permanece en `governance.yml`
- Flujo completo booking → admin → inbox → confirm: pendiente (requiere Supabase)

## Smoke producción

- Manual en URL pública con Replicate real
- Checklist DoD completa: `docs/dod-smoke-checklist.md` (Phase 9)
- Evidencia: `npm run smoke:dod -- --init` → `smoke-evidence/` (gitignored)
- Operador: OP-017 en `docs/operator-actions.md`
- **DoD status: NOT VERIFIED** hasta que OP-017 complete con evidencia fechada
- No automatizar gasto de presupuesto en CI

## Benchmark

- Paralelo al desarrollo visual; **obligatorio antes** de declarar demo pública lista
- 16 gens smoke → 48 si OK
- Resultados en `ai-benchmark.md` sin fotos personales en Git

## Calidad de fase

Tras cada fase: lint, typecheck, tests aplicables; no avanzar con fallos conocidos.
