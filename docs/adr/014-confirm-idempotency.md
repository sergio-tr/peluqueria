# ADR-014 — Confirmación idempotente

## Status
Accepted (2026-07-31 — D-08)

## Decision
- Primer `POST` válido de confirmación: confirma y aplica efectos **una vez**.
- Repetición del mismo token ya usado / ya confirmado: **200** con booking confirmado.
- No duplicar `booking_events` de confirmación.
- No duplicar notificación final.
- Token desconocido: **404**
- Token caducado o invalidado: **410**
- Estado incompatible: **409**
- Clave de idempotencia de notificación final: `booking-confirmed:{booking_id}`

## Consequences
Tests de confirmación deben cubrir 200 idempotente y ausencia de side effects duplicados (Fase 2C / 4).
