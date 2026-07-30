# ADR-009 — Mock solo fuera de producción real

## Status
Accepted

## Context
DoD exige Replicate en URL pública.

## Decision
`MockHairProvider` para local/tests/CI/`AI_PROVIDER=mock`. Prod: `replicate-qwen`; config faltante → error; nunca fallback silencioso a mock; badge en cualquier resultado mock.

## Consequences
Smoke prod obligatorio antes de “terminado”.
