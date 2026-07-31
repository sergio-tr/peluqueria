# Prompt — Fase 2D: Activos definitivos del catálogo

Repositorio:

`c:\Users\Sergio\workspaces\peluqueria`

Rama obligatoria:

`update/catalog-production-assets`

Determina la rama predecesora en `docs/agent-operations.md`.

Crea la rama desde su predecesora si esta todavía no ha sido fusionada. La pull request debe apuntar siempre a `main`.

## Alcance

Sustituye SVG de referencia por un set propio homogéneo.

Cada hairstyle debe tener:
- catalog_image;
- ai_reference_image;
- thumbnail;
- asset_version;
- provenance;
- usage_rights.

Usa herramientas de generación disponibles solo para crear assets legales y no identificables. Si no existe una herramienta de imagen adecuada, implementa schema/pipeline y deja la PR Draft con un operator action preciso; no presentes SVG como definitivo.

Actualiza seed y attribution.

## Ejecución obligatoria

1. Lee AGENTS.md, decision register, recovery plan, auditoría, gaps y ADR.
2. Invoca planner.
3. Invoca architect cuando aplique.
4. Crea change record y agent run record.
5. Implementa solo el scope.
6. Añade y ejecuta tests.
7. Invoca security auditor cuando aplique.
8. Actualiza documentación canónica.
9. Invoca independent verifier.
10. Corrige hallazgos del scope.
11. Ejecuta `.cursor/scripts/check-pr-readiness.mjs`.
12. Crea commits convencionales sin mencionar Cursor.
13. Push sin force.
14. Abre PR contra main.
15. Indica dependencia de stack.
16. No merges, no cierres y no borres ramas.
17. Usa Draft PR si existe un bloqueo externo.

Devuelve PR URL, commits, tests, bloqueos y estado real.
