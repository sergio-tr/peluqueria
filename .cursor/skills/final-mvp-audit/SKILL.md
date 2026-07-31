---
name: final-mvp-audit
description: Audita el MVP completo contra DoD, decisiones, recovery plan, seguridad, tests y producción antes de declararlo terminado.
---

# Final MVP Audit

Revisa cada requisito DoD y aporta evidencia.

Estados permitidos:

- VERIFIED
- IMPLEMENTED_UNVERIFIED
- PARTIAL
- NOT_IMPLEMENTED
- BLOCKED

Incluye:
- URL y fecha;
- commit/PR;
- pruebas;
- job IDs internos sin PII;
- booking ID de prueba;
- evidencia de solape rechazado;
- evidencia de retención/cron;
- evidencia de Replicate real;
- evidencia de Demo Inbox durable.

No declares MVP terminado si un P0 o P1 permanece abierto.
