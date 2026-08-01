# AI benchmark

**Estado:** harness implementado (Fase 6); **ejecución live pendiente** — matriz 48 **NO ejecutada**. No declarar demo pública lista sin informe go/no-go.

## Protocolo (ADR-016 / C-09)

1. **Smoke 16** — gate temprano de sanidad (fallos estructurales, referencias inválidas). No sustituye el benchmark definitivo.
2. Si smoke live pasa → **matriz 48** (6 fotos × 8 cortes).
3. Ponderación: identidad 30 %; fidelidad 25 %; realismo 20 %; deformaciones 10 %; latencia 10 %; coste 5 %. Detalle en [`ai-benchmark/rubric.md`](ai-benchmark/rubric.md).
4. AC go: **≥ 80 % enseñables** (revisión humana por generación).

## Harness

| Comando | Descripción |
|---------|-------------|
| `npm run benchmark:smoke` | Smoke 16 — live si `REPLICATE_API_TOKEN`; si no, dry-run PENDING |
| `npm run benchmark:matrix` | Matriz 48 — dry-run por defecto sin token |
| `npm run benchmark:aggregate -- <result.json>` | Recalcula summary + propuesta D-04B |
| `npm run benchmark:self-test` | Verifica agregación contra golden fixtures |

Archivos:

- Manifiesto: `scripts/ai-benchmark/fixtures/manifest.json`
- Plantilla resultado: `docs/ai-benchmark/result-template.json`
- Resultados (gitignored): `benchmark-results/`
- Fotos sujeto (gitignored): `benchmark-fixtures/photos/`

## Fixtures

Fotos sintéticas o licenciadas **fuera de Git** (`benchmark-fixtures/photos/`). Nunca fotos personales reales en el repositorio. Referencias de peinado: PNG raster (assets 2D); **SVG no válido**.

## Registro oficial

| Run | Fecha | Model | Prompt ver | Asset ver | N | Enseñables % | Coste p95 USD | Latencia p50/p95 ms | D-04B cap propuesto | Conclusión |
|-----|-------|-------|------------|-----------|---|--------------|---------------|---------------------|---------------------|------------|
| — | — | qwen/qwen-image-edit-plus | v1-2026-07-30 | — | — | — | — | — | **PENDING_BENCHMARK** | Harness only — live run pending (OP-012) |

## Prompt y parámetros

- `prompt_version`: `v1-2026-07-30` (`PROMPT_VERSION` en código)
- Modelo: `qwen/qwen-image-edit-plus` (sin pin — D-02)
- Coste estimado por output: `AI_ESTIMATED_COST_PER_OUTPUT_USD` (default 0.03)

## D-04B — cap mensual numérico

Permanece **PENDING_BENCHMARK** hasta que la matriz 48 live aporte `costUsdP95`. El harness calcula automáticamente:

`proposedMonthlyGenCap = floor(30 EUR / p95_cost_eur_per_gen)`

Ver `src/domain/ai/benchmark-d04b.ts`.

## Conclusión

_TBD tras ejecución live de matriz 48 con assets 2D de producción y revisión humana._
