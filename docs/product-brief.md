# Product brief — Peluquería Nowi

## Qué es

Web demo para una peluquería de Madrid que combina prueba virtual de corte (IA), solicitud de cita, revisión del profesional y confirmación del cliente (simulada in-app en v1).

**Claim:** Tu próximo corte, antes de sentarte.

## Marca (datos demo)

| Campo | Valor |
|-------|--------|
| Nombre | Peluquería Nowi |
| Ciudad | Madrid |
| Dirección | Calle de Velázquez, 118, 28006 Madrid |
| Teléfono | +34 910 245 782 |
| Instagram | @peluquerianowi |
| URL | https://peluqueria-nowi.netlify.app |
| Tratamiento | tú (español) |

## Público

Hombres 18–45: cortes actuales, degradados, cambios de estilo, barba, asesoramiento visual previo. Tono moderno, cercano, directo, masculino no agresivo, ligeramente premium. La IA es herramienta para elegir mejor el corte, no el centro del negocio.

## Objetivos del MVP

1. Impacto visual editorial.
2. Flujo de prueba virtual con **IA real en producción** (Replicate).
3. Flujo de reservas con holds y solapes garantizados en Postgres.
4. Panel del profesional.
5. Confirmación vía Demo Inbox (sin email real).
6. Despliegue Netlify protegido por código de acceso.

## Fuera de alcance v1

Correos reales (Resend preparado conceptualmente), dominio propio, facturación, SMS/WhatsApp, app móvil, multi-sucursal, Google Calendar, entrenamiento de modelos, análisis demográfico, Modal/HairFastGAN (solo documentado).

## Servicios

| Servicio | Precio | Duración base | Try-on |
|----------|--------|---------------|--------|
| Corte Nowi | 24 € | 45 min | Sí |
| Corte + barba | 34 € | 60 min | Sí |
| Fade premium | 29 € | 60 min | Sí |
| Cambio de look | 39 € | 75 min | Sí |
| Arreglo de barba | 16 € | 30 min | No (salta) |

**Duración sugerida** = base servicio + minutos por complejidad del estilo (baja 0 / media 15 / alta 30) + margen configurable. El profesional puede sobrescribirla. No se usa IA para duración.

## Horario

- Lun / Dom: cerrado
- Mar–Vie: 10:00–14:00 y 16:00–20:00
- Sáb: 10:00–18:00
- Festivos: cerrado
- Slots: 15 minutos
- TZ presentación: `Europe/Madrid` (persistencia UTC)

## Catálogo (8)

Low fade, Mid fade, High fade, French crop, Buzz cut, Pompadour, Slick back, Curly crop. Imagen de catálogo ≠ imagen de referencia IA (ver `assets-attribution.md`).

## Success metric (DoD)

Flujo E2E en URL pública con generación **Replicate real**, propuesta profesional, confirmación Demo Inbox y agenda bloqueada. Ver `acceptance-criteria.md`.
