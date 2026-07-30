# Acceptance criteria

## DoD demo pública (obligatorio)

En `https://peluqueria-nowi.netlify.app` (o URL deploy real):

1. Acceso con código
2. Fotografía (cámara o upload) + crop
3. Consentimiento antes de subida
4. Selección de corte
5. Generación **Replicate real** (no mock)
6. Comparador y adjunto
7. Solicitud de cita
8. Profesional revisa y propone/ajusta
9. Demo Inbox muestra enlace
10. Cliente confirma
11. Agenda actualizada
12. Intervalo bloqueado (solape imposible)

## IA

- Prod `AI_PROVIDER=replicate-qwen`; config ausente → error servicio
- Mock solo local/CI/flag explícito; badge visible
- Nunca sustituir fallo real por mock
- Límites session/IP/mes/concurrente + kill switch
- Webhook firmado, idempotente; resultado en Storage privado
- Benchmark ≥80 % enseñables documentado antes de “lista”

## Reservas

- Duración = fórmula documentada; override profesional
- Slots 15 min; UTC persistido; UI Europe/Madrid
- Solapes impedidos en Postgres (estados bloqueantes)
- Holds 24h / 12h; expire cron + admin misma op
- Tokens: hash, expiry, single-use, invalidación en nueva propuesta
- Confirm idempotente

## Privacidad

- Consent antes de upload
- Sin signed URLs en logs/payload persistente job
- Retención demo + borrado admin

## Calidad

- Lint + typecheck + tests verdes por fase
- E2E mock en CI
- Sin secretos en repo
