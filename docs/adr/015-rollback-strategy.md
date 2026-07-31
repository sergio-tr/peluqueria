# ADR-015 — Estrategia de rollback

## Status
Accepted (2026-07-31 — C-08)

## Context
`migrate down` como rollback genérico es frágil e inseguro en entornos compartidos.

## Decision
Rollback permitido:

- previous deploy (Netlify)
- kill switches de feature (`AI_GENERATION_ENABLED`, flags de upload, etc.)
- forward corrective migrations
- expand/contract de schema
- backup previo a operaciones destructivas

**Prohibido:** `migrate down` como estrategia genérica de recuperación.

## Consequences
Toda fase del recovery plan debe documentar rollback en estos términos.
