# ADR-003 — Gate de demostración por código

## Status
Accepted

## Context
Presupuesto IA limitado; demo no debe ser totalmente pública.

## Decision
`DEMO_ACCESS_CODE` en env; cookie firmada; middleware protege rutas app.

## Consequences
Friction baja para demos; secreto rotatorio sin redeploy de código.
