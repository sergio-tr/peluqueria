# Assumptions

Decisiones fijadas sin repreguntar. Si cambian, actualizar este archivo y los ADRs afectados.

| ID | Supuesto |
|----|----------|
| A1 | Un salón, un profesional; todas las tablas llevan `salon_id` sin UI multi-tenant. |
| A2 | Clientes sin cuenta; un admin vía Supabase Auth. |
| A3 | Sin pagos, SMS, WhatsApp, app nativa, Google Calendar bidireccional. |
| A4 | Sin Resend en v1; confirmación = token real + Demo Inbox UI. |
| A5 | Dominio = subdominio Netlify; sin razón social/fiscal real. |
| A6 | Gate demo: `DEMO_ACCESS_CODE` en env. |
| A7 | Producción: `AI_PROVIDER=replicate-qwen`. Mock solo local/CI/`AI_PROVIDER=mock` explícito. |
| A8 | Modelo: `REPLICATE_MODEL=qwen/qwen-image-edit-plus` (endpoint oficial; sin pin de versión obligatorio). |
| A9 | Presupuesto conceptual 30 €/mes; límites vía env (ver `ai-provider.md`). |
| A10 | Retención imágenes demo: draft 24h; no confirmada 7d; confirmada 7d post-cita; borrado admin. |
| A11 | Holds: pending review 24h; pending customer 12h; confirmed bloqueo definitivo. |
| A12 | Margen duración global default = 0 min. |
| A13 | Complejidad seed: buzz baja; french crop / slick / curly media; fades y pompadour alta (ajustable). |
| A14 | Personas adultas; imagen propia declarada + consentimiento con versión de política. |
| A15 | Festivos = cerrado (tabla o regla simple; seed sin calendario exhaustivo de festivos ES). |
| A16 | Netlify Scheduled Function cada hora para expiración; misma operación que “Simular expiración”. |
| A17 | Generación async: Replicate prediction + webhook; polling al proveedor solo fallback admin. |
| A18 | Placeholders de catálogo/referencia con licencia registrada; sin fotos personales en Git. |
