# ADR-007 — Expiración vía Scheduled Function

## Status
Accepted

## Context
Holds 24h/12h deben liberar slots sin depender solo de demo manual.

## Decision
Netlify Scheduled Function horaria llama la misma operación de dominio que “Simular expiración” admin (`expireDue`). Trabajo breve DB; no procesa imágenes.

## Consequences
Una sola fuente de reglas de expiración; cron secret requerido.
