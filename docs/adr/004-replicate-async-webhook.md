# ADR-004 — Replicate asíncrono mediante webhook

## Status
Accepted

## Context
Las Background Functions de Netlify no son el mecanismo adecuado como flujo principal de generación larga.

## Decision
`POST /api/ai/jobs` crea prediction async + webhook `completed`; cliente solo pollea nuestro `GET /api/ai/jobs/[id]`. Webhook verifica firma, skew, idempotencia; persiste output en Storage. Poll a Replicate solo recuperación admin.

## Consequences
Necesita URL HTTPS pública para webhook; más robusto ante timeouts de serverless.
