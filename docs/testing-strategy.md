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
- Flujo: gate → foto fixture → corte → job mock → book → admin propose → inbox → confirm → agenda
- Marca “Demostración” visible en resultados mock

## Smoke producción

- Manual en URL pública con Replicate real
- Checklist DoD completa
- No automatizar gasto de presupuesto en CI

## Benchmark

- Paralelo al desarrollo visual; **obligatorio antes** de declarar demo pública lista
- 16 gens smoke → 48 si OK
- Resultados en `ai-benchmark.md` sin fotos personales en Git

## Calidad de fase

Tras cada fase: lint, typecheck, tests aplicables; no avanzar con fallos conocidos.
