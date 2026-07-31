# Reglas de revisión — Peluquería Nowi

Revisa cada pull request como un gate previo a la revisión humana.

## Hallazgos bloqueantes

Marca como bloqueante cualquier cambio que:

- permita commits, pushes o merges directos a `main`;
- incluya referencias a Cursor en commits, título o cuerpo de PR;
- cambie código sin registro en `docs/changes/`;
- cambie arquitectura, scope, decisiones, API, datos, seguridad o despliegue sin actualizar la documentación canónica;
- introduzca secretos, claves demo operativas o defaults inseguros;
- permita `memoryDb` o `MockHairProvider` en preview o producción;
- use auth administrativa mediante una clave estática;
- exponga PII o signed URLs en logs;
- persista fotos sin validación y eliminación de EXIF;
- confíe solo en frontend para solapamientos;
- omita tests relevantes;
- declare VERIFIED sin evidencia;
- implemente Resend, Modal, HairFastGAN, pagos, SMS, WhatsApp, multi-salón o multi-staff sin una decisión aprobada.

## Revisión por dominio

### Persistencia

- Validar transacciones, constraints, idempotencia y RLS.
- Verificar que service role solo se usa en servidor.
- Rechazar `migrate down` como rollback genérico.

### Reservas

- Estados bloqueantes: PENDING_BARBER_REVIEW, PENDING_CUSTOMER_CONFIRMATION y CONFIRMED.
- Holds: 24 h y 12 h.
- Confirmed no expira automáticamente.
- Liberación atómica del intervalo.

### Confirmación

- Hash-only.
- 200 idempotente tras éxito.
- 404 token desconocido.
- 410 caducado o invalidado.
- 409 estado incompatible.
- Sin eventos ni notificaciones duplicadas.

### IA

- Replicate real en preview/producción.
- Sin fallback silencioso a mock.
- Output copiado a Storage propio en la fase correspondiente.
- Presupuesto mensual de 30 €.
- Cap mensual pendiente del coste p95.

### Privacidad

- DRAFT 24 h.
- No confirmada 7 días.
- Confirmada 30 días después de la cita.
- Storage privado y previews firmadas de corta duración.

## Resultado esperado

Reporta:

1. bloqueantes;
2. riesgos altos;
3. regresiones;
4. tests ausentes;
5. documentación ausente;
6. evidencia revisada.

No fusiones ni cierres la PR.
