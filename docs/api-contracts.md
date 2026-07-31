# API contracts

Base: Route Handlers Next.js. JSON + Zod. Errores tipados `{ code, message }`. Sin logging de signed URLs ni fotos.

## Demo gate

### `POST /api/demo-access`
Body: `{ code: string }` → Set-Cookie sesión demo. 401 si inválido.

## Photos

### `POST /api/photos`
Requiere sesión demo + consent en body (`policyVersion`, `isOwnImage: true`).  
Multipart imagen ya recortada.  
Valida mime/size/dims; strip EXIF; guarda privado.  
→ `{ photoId, path }` (no signed URL larga al cliente salvo preview corta si hace falta UI).

## Catalog / services / availability

### `GET /api/services`
### `GET /api/hairstyles` — devuelve `catalog` URLs firmadas cortas; **no** expone paths de referencia IA al cliente si no es necesario.
### `GET /api/availability?serviceId&date=YYYY-MM-DD&hairstyleId?`
Slots libres 15 min en Europe/Madrid → UTC.

## AI jobs

### `POST /api/ai/jobs`
Body: `{ photoId, hairstyleId, sessionId }`  
Valida límites + consent previo.  
Crea job QUEUED + prediction Replicate + webhook.  
→ `{ jobId }` inmediato.

### `GET /api/ai/jobs/[jobId]`
→ `{ status, resultPreviewUrl?, errorCode? }`  
Preview firmada corta solo si SUCCEEDED.

### `POST /api/ai/jobs/[jobId]/retry`
Reencola si FAILED y límites OK.

### `POST /api/webhooks/replicate`
Headers firma Replicate. Verifica signature + timestamp skew. Idempotente por `external_prediction_id`. Relaciona prediction→job. Persiste output. 2xx rápido. No confiar en jobId como auth.

## Booking

### `POST /api/booking-requests`
Crea `PENDING_BARBER_REVIEW` (o flujo barba sin AI). Hold 24h.

## Confirm

### `GET /api/confirm/[token]` — resumen seguro (token plaintext solo en URL una vez).
### `POST /api/confirm` — `{ token, action: "confirm"|"decline" }` idempotente.

## Admin (Auth required)

### `GET /api/admin/booking-requests`
### `GET /api/admin/booking-requests/[id]`
### `POST /api/admin/booking-requests/[id]/transition`  
Body: `{ action, proposedStartsAt?, durationMinutes?, comment? }` — TX completa.
### `GET /api/admin/agenda?from&to`
### `GET /api/admin/ai-usage` — mes: gens, success, fail, cost estimado.
### `POST /api/admin/expire-due` — misma op que Scheduled Function.
### `POST /api/admin/purge` — misma op que Scheduled Function purge.
### `POST /api/admin/photos/delete` — borrado manual. Body: `{ photoId }`.
### `GET /api/admin/demo-inbox`

## Internal

### Scheduled: `POST /api/cron/expire` (protegido por `CRON_SECRET`) → expireDue idempotente.
### Scheduled: `POST /api/cron/purge` (protegido por `CRON_SECRET`) → purge idempotente (ADR-012).
