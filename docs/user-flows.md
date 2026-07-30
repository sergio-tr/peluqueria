# User flows

## Gate demo

1. Usuario abre URL → si no hay cookie válida, pantalla de código.
2. Introduce `DEMO_ACCESS_CODE` → cookie firmada de sesión corta.
3. Accede a la app.

## Cliente — try-on + reserva

1. Landing → “Probar un corte” (o “Reservar” / arreglo de barba sin try-on).
2. Captura o selección local de foto.
3. Recorte local + validación local (formato, tamaño, dims).
4. Lee privacidad → consentimiento explícito + declaración de autoría.
5. **Tras consent:** subida a Storage privado.
6. Selección de corte del catálogo (ve `catalog_image`; el sistema usa `ai_reference` en backend).
7. Solicita generación → recibe `jobId` → polling `GET /api/ai/jobs/[jobId]` con backoff.
8. Compara original vs resultado; elige adjuntar.
9. Elige servicio, día, hora (slots 15 min, TZ Madrid).
10. Nombre, email, teléfono; acepta políticas.
11. Envía solicitud → `PENDING_BARBER_REVIEW` → pantalla “horario pendiente de revisión”.

**Atajo barba:** servicio “Arreglo de barba” → sin pasos 2–8 de try-on → booking directo.

## Profesional

1. Login admin.
2. Lista solicitudes nuevas.
3. Abre detalle: original, ref catálogo/IA, resultado, servicio, comentarios, horario pedido, duración sugerida.
4. Ajusta duración y/o horario.
5. Aprueba / propone otro horario / rechaza (transacción atómica; ver arquitectura).
6. Sistema crea token + mensaje Demo Inbox; estado `PENDING_CUSTOMER_CONFIRMATION`.

## Confirmación (simulada)

1. Admin (o demos) abre Demo Inbox → enlace `/confirm/[token]`.
2. Cliente ve resumen → Confirmar o Rechazar (POST idempotente).
3. `CONFIRMED` o `DECLINED`; agenda actualizada; intervalo liberado si decline/reject/expire/cancel.

## Expiración

- Automática: Scheduled Function horaria.
- Manual demo: “Simular expiración” (misma operación de dominio).
