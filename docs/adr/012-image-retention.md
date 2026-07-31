# ADR-012 — Retención de imágenes

## Status
Accepted (2026-07-31 — C-07)

## Context
Había referencias contradictorias a 7 días post-cita para citas confirmadas.

## Decision
Retención:

| Estado | Plazo |
|--------|--------|
| DRAFT | 24 horas |
| Solicitud no confirmada | 7 días |
| Cita confirmada | **30 días después de la cita** |

Borrado manual desde administración permitido. No retención indefinida.

## Consequences
Purge y tests deben usar 30 días post-cita (Fase 5). Docs antiguos con “7 días post-cita” quedan obsoletos.
