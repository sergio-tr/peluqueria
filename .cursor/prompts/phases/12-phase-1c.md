# Prompt — Fase 1C: Fotografías seguras y Storage privado

Repositorio:

`c:\Users\Sergio\workspaces\peluqueria`

Rama obligatoria:

`security/secure-photo-storage`

Determina la rama predecesora en `docs/agent-operations.md`.

Crea la rama desde su predecesora si esta todavía no ha sido fusionada. La pull request debe apuntar siempre a `main`.

## Alcance

Implementa el pipeline seguro de fotografías:
- consentimiento previo;
- validación por contenido;
- MIME permitido;
- tamaño y dimensiones;
- normalización;
- EXIF strip antes de persistir;
- bucket privado;
- path en DB;
- preview mediante signed URL breve;
- no data URLs como fuente de verdad.

No implementes todavía retención completa ni outputs de Replicate.

Incluye fixtures sin PII y tests de MIME spoof, oversize, dimensiones y EXIF.

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
