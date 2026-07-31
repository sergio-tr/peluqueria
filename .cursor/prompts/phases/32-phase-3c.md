# Prompt — Fase 3C: Outputs, retry y límites

Repositorio:

`c:\Users\Sergio\workspaces\peluqueria`

Rama obligatoria:

`feature/replicate-storage-limits`

Determina la rama predecesora en `docs/agent-operations.md`.

Crea la rama desde su predecesora si esta todavía no ha sido fusionada. La pull request debe apuntar siempre a `main`.

## Alcance

Completa:
- descarga del output;
- validación;
- copia a Storage privado;
- result_image_path;
- signed preview;
- retry real;
- counters durables;
- 3 gens/session;
- 1 concurrente/session;
- límite diario configurable;
- kill switch;
- presupuesto 30 €;
- alertas 70/90/100;
- panel usage.

El cap mensual numérico permanece PENDING_BENCHMARK.

No implementar Modal/HairFastGAN.

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
