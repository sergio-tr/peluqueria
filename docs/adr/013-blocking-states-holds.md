# ADR-013 — Estados que bloquean agenda y caducidades

## Status
Accepted (2026-07-31 — D-07)

## Decision
**Bloquean intervalo:**

- `PENDING_BARBER_REVIEW`
- `PENDING_CUSTOMER_CONFIRMATION`
- `CONFIRMED`

Cualquier otro estado **no** bloquea.

**Caducidades:**

- `PENDING_BARBER_REVIEW`: 24 horas  
- `PENDING_CUSTOMER_CONFIRMATION`: 12 horas  
- `CONFIRMED`: permanente hasta cancelación  

La liberación del intervalo se ejecuta **atómicamente** con la transición de estado (expire, decline, reject, cancel).

## Consequences
Exclusion constraint y `expireDue` deben alinearse exactamente con este conjunto.
