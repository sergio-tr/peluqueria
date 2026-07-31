# Prompt — Fase 3B: Replicate predictions y webhook

Repositorio:

`c:\Users\Sergio\workspaces\peluqueria`

Rama obligatoria:

`feature/replicate-async-webhook`

Determina la rama predecesora en `docs/agent-operations.md`.

Crea la rama desde su predecesora si esta todavía no ha sido fusionada. La pull request debe apuntar siempre a `main`.

## Alcance

Implementa predictions async reales y webhook:
- provider Replicate;
- job metadata D-02;
- firma obligatoria en preview/prod;
- skew;
- dedupe delivery;
- events out-of-order;
- terminal state idempotence;
- fail-closed sin mock.

No copies aún output a Storage; eso es 3C.

Requiere tests de firma, replay, duplicado y mapping.

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
