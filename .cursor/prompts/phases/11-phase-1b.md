# Prompt — Fase 1B: Datos maestros y disponibilidad

Repositorio:

`c:\Users\Sergio\workspaces\peluqueria`

Rama obligatoria:

`feature/master-data-persistence`

Determina la rama predecesora en `docs/agent-operations.md`.

Crea la rama desde su predecesora si esta todavía no ha sido fusionada. La pull request debe apuntar siempre a `main`.

## Alcance

Implementa repositorios y mappers para salons, staff, services, hairstyles, availability_rules y blocked_periods.

Conecta:
- GET services;
- GET hairstyles;
- GET availability.

Elimina dependencia runtime de seeds in-memory para estas lecturas.

Persiste UTC y presenta Europe/Madrid.

Excluye uploads, booking writes, IA y assets definitivos.

Añade tests de repositorios, mappers y availability con seed.

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
