# Security & privacy

## Gate

`DEMO_ACCESS_CODE` solo en env. Cookie de sesión firmada (httpOnly, secure en prod, SameSite).

## Storage

Buckets privados. Signed URLs: creadas solo en backend; TTL corto para UI; TTL suficiente para que Replicate descargue **sin** devolverlas al cliente ni persistirlas en `input_parameters_json` ni logs.

## Consentimiento

Orden obligatorio: captura → crop → validación local → info privacidad → consent → upload → generación.  
Registrar versión de política + “imagen propia”. No upload pre-consent.

## EXIF / validación

Strip EXIF. Validar mime, tamaño, dimensiones. Rate limit generaciones.

## Tokens confirmación

Crypto random; store hash only; expiry; single use; invalidar anteriores al proponer de nuevo; confirmación idempotente.

## Webhook Replicate

Verificar firma; tolerancia temporal anti-replay; idempotencia; no auth por jobId solo; mapear `external_prediction_id`.

## Secrets

Service role solo servidor. `.env.example` completo; nunca secretos en repo. Logs estructurados sin PII, sin fotos, sin signed URLs, sin prompts con datos sensibles.

## IP

Hash con `IP_HASH_SECRET` para contadores diarios; no IP en claro.

## Retención (demo)

| Fase | Plazo |
|------|-------|
| Borrador | 24 h |
| No confirmada | 7 días |
| Confirmada | 7 días post-cita |
| Manual | Borrado admin |

## RLS

Políticas explícitas; denegar acceso público a objetos privados.
