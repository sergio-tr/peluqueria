# Deployment

## Stack hosting

- Netlify: Next.js app + Scheduled Function horaria + env vars
- Supabase: Postgres, Auth, Storage (Free ok)
- Replicate: API token + webhook URL pública HTTPS

## Cuentas a crear

| Servicio | Dónde | Para qué |
|----------|-------|----------|
| Netlify | https://app.netlify.com | Deploy (cuenta existente OK) |
| Supabase | https://supabase.com | DB, Auth, Storage |
| Replicate | https://replicate.com | Inferencia Qwen |

Resend: **no** en v1.

## Variables (ver `.env.example`)

Críticas prod: `DEMO_ACCESS_CODE`, `NEXT_PUBLIC_SITE_URL`, Supabase URL/keys, `SUPABASE_SERVICE_ROLE_KEY`, `REPLICATE_API_TOKEN`, `REPLICATE_WEBHOOK_SECRET`, `AI_PROVIDER=replicate-qwen`, `REPLICATE_MODEL`, límites AI, `IP_HASH_SECRET`, `CRON_SECRET`, cookie secrets.

## Webhook

`https://peluqueria-nowi.netlify.app/api/webhooks/replicate` (o URL deploy). Configurar en create prediction.

## Cron

Netlify Scheduled Function → `POST /api/cron/expire` con `Authorization: Bearer $CRON_SECRET` cada hora.

## Comandos

```bash
npm run dev
npm run lint && npm run typecheck && npm test
npm run build
npx netlify deploy --prod
```

## Si falta credencial

Dejar implementación completa; validar con mock donde aplique; documentar: variable ausente, dónde obtenerla, dónde configurarla (Netlify UI / `.env`), comando deploy, prueba manual pendiente. **No inventar** tokens ni resultados.
