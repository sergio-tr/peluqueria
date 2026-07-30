# ADR-008 — Catálogo vs referencia IA

## Status
Accepted

## Context
Imágenes atractivas de catálogo no siempre sirven para transferencia de peinado.

## Decision
Campos separados `catalog_image_path` y `ai_reference_image_path` (+ atribución y `prompt_modifier`). Criterios de homogeneidad para refs IA.

## Consequences
Más assets que mantener; mejor calidad de try-on.
