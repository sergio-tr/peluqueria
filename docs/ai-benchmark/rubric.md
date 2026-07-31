# AI benchmark rubric

**Protocol:** ADR-016 / C-09  
**Weights:** identidad 30 % · fidelidad 25 % · realismo 20 % · deformaciones 10 % · latencia 10 % · coste 5 %

## Fases

| Fase | Generaciones | Propósito |
|------|--------------|-----------|
| Smoke 16 | 16 | Gate temprano de sanidad estructural (fallos API, referencias inválidas, timeouts). **No** sustituye el benchmark definitivo. |
| Matriz 48 | 6 fotos × 8 cortes | Benchmark definitivo para go/no-go demo pública y propuesta D-04B. |

## Criterio de go (C-09)

- **≥ 80 % enseñables** en la matriz 48 ( revisión humana por generación).
- Una generación es **enseñable** cuando el resultado es apto para mostrar en demo sin explicaciones de disculpa (identidad reconocible, peinado creíble, sin deformaciones graves).

El **weighted score** (0–100) es métrica de calidad agregada; el gate oficial usa el porcentaje de enseñables, no solo la media ponderada.

## Escala por dimensión (0–5)

| Dimensión | Peso | 0 | 3 | 5 |
|-----------|------|---|---|---|
| Identidad | 30 % | Rostro irreconocible | Identidad reconocible con leve deriva | Identidad preservada |
| Fidelidad al corte | 25 % | Peinado incorrecto | Silueta aproximada | Coincide con referencia |
| Realismo | 20 % | Claramente artificial | Aceptable en demo | Fotorrealista |
| Deformaciones | 10 % | Artefactos graves | Menores tolerables | Sin artefactos |
| Latencia | 10 % | > 60 s | 20–40 s | < 15 s |
| Coste | 5 % | > 2× estimado | Cerca del estimado | ≤ estimado |

Puntuación ponderada:

```
weighted = Σ (score_dim / 5 × peso_dim)   // 0–100
```

Implementación canónica: `src/domain/ai/benchmark-rubric.ts`.

## Revisión humana

Tras ejecución live, el operador:

1. Inspecciona cada output (fuera de Git o en storage privado).
2. Marca `teachable: true|false` y `dimensionScores` en el JSON de resultado o hoja de revisión.
3. Ejecuta `npm run benchmark:aggregate -- benchmark-results/matrix-48-<runId>.json`.
4. Copia conclusiones a `docs/ai-benchmark.md`.

## D-04B (cap mensual numérico)

Tras matriz 48 live con costes medidos:

```
proposedMonthlyGenCap = floor(AI_MONTHLY_BUDGET_EUR / p95_cost_eur_per_gen)
```

Mientras no haya p95 real: estado **PENDING_BENCHMARK** (decision register D-04B).

## Restricciones

- Sin fotos personales en Git.
- Referencias de peinado: **PNG raster** (assets 2D); SVG no válido.
- No pin de modelo hasta conclusión go/no-go (D-02).

## Fixtures

- Manifiesto: `scripts/ai-benchmark/fixtures/manifest.json`
- Fotos sujeto: `benchmark-fixtures/photos/` (gitignored)
- Resultados: `benchmark-results/` (gitignored)
