# Prompt — Fase 2C: Tokens, confirmación y expiración

Repositorio:

`c:\Users\Sergio\workspaces\peluqueria`

Rama obligatoria:

`feature/idempotent-confirmation-expiration`

Determina la rama predecesora en `docs/agent-operations.md`.

Crea la rama desde su predecesora si esta todavía no ha sido fusionada. La pull request debe apuntar siempre a `main`.

## Alcance

Implementa D-08 al pie de la letra:
- token hash-only;
- invalidación al reproponer;
- primer POST confirma una vez;
- repetición 200 sin efectos duplicados;
- 404 desconocido;
- 410 caducado/invalidado;
- 409 estado incompatible;
- idempotency key booking-confirmed:{booking_id}.

Expiración:
- review 24 h;
- confirmación 12 h;
- confirmed no caduca;
- cron y admin usan el mismo caso de uso;
- liberar slot atómicamente.

Incluye tests de estados, eventos y duplicados.

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
