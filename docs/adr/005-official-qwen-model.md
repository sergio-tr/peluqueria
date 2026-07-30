# ADR-005 — Modelo oficial Qwen sin pin manual de versión

## Status
Accepted

## Context
El brief pedía pin de versión; el modelo oficial `qwen/qwen-image-edit-plus` se mantiene por Replicate.

## Decision
Usar `REPLICATE_MODEL=qwen/qwen-image-edit-plus` sin exigir `REPLICATE_MODEL_VERSION`. Persistir `reported_model_version` por prediction. Futura reproducibilidad estricta → deployment/versionado controlado.

## Consequences
Menor fricción setup; ligera incertidumbre de reproducibilidad a largo plazo, mitigada por log por job.
