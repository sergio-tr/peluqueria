# ADR-016 — Benchmark de IA (smoke 16 vs matriz 48)

## Status
Accepted (2026-07-31 — C-09)

## Decision
- **Smoke 16:** únicamente gate temprano de sanidad.
- **Benchmark definitivo:** 6 fotografías × 8 cortes = **48** generaciones.
- Pesos: identidad 30 %; fidelidad 25 %; realismo 20 %; deformaciones 10 %; latencia 10 %; coste 5 %.
- Criterio de go: ≥ 80 % enseñables, documentado en `docs/ai-benchmark.md`.
- Sin fotos personales en Git; sin SVG placeholder como referencia de modelo.

## Consequences
No declarar demo pública lista solo con smoke 16. Pin de modelo solo tras este benchmark (ADR futuro si aplica).
