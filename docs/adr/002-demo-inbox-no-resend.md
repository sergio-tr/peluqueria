# ADR-002 — Sin Resend en v1; Demo Inbox

## Status
Accepted

## Context
Confirmación por email es parte del producto final, pero no prioritaria para la demo.

## Decision
Tokens y flujo HTTP reales; “correo” simulado vía `demo_inbox_messages`. Puerto `NotificationPort` con adapter demo; Resend futuro.

## Consequences
DoD no exige email real; contrato listo para Resend sin reescribir dominio.
