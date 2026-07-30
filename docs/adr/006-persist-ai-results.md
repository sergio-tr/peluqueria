# ADR-006 — Persistencia inmediata del resultado IA

## Status
Accepted

## Context
Las URLs de salida de Replicate son efímeras y no deben alimentar la UI a largo plazo.

## Decision
En webhook exitoso: descargar output → guardar en Supabase Storage privado → `result_image_path` → `SUCCEEDED`. UI solo usa signed URLs propias.

## Consequences
Latencia extra en webhook; independencia del CDN de Replicate.
