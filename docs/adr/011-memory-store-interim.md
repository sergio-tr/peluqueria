# ADR-011 — Memory store mientras Supabase no esté configurado

## Status
Accepted (interim)

## Context
El MVP debe ser demostrable en local sin bloquear por falta de cuenta Supabase.

## Decision
`DATA_STORE=memory` (default): persistencia en memoria de proceso para fotos, jobs, bookings, tokens e inbox. Migraciones SQL y seed de Supabase viven en `supabase/` listos para aplicar. Cuando existan credenciales, se migrará a `DATA_STORE=supabase` sin cambiar contratos de API.

## Consequences
Datos no sobreviven reinicios ni multi-instancia Netlify. **No apto como backend de producción multi-nodo.** Documentar variables ausentes; DoD con Replicate real requiere además Storage persistente (Supabase) para no perder resultados entre instancias.
