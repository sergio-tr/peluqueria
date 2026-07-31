# Prompt — Fase 2A: Auth y protección API

Repositorio:

`c:\Users\Sergio\workspaces\peluqueria`

Rama obligatoria:

`security/admin-auth-api-protection`

Determina la rama predecesora en `docs/agent-operations.md`.

Crea la rama desde su predecesora si esta todavía no ha sido fusionada. La pull request debe apuntar siempre a `main`.

## Alcance

Sustituye ADMIN_DEMO_KEY y hardcode por Supabase Auth.

Protege UI y APIs admin server-side.

Corrige endpoint público con PII.

Endurece gate global:
- sin defaults;
- cookie segura;
- rate limit durable;
- gate separado de auth profesional.

Incluye tests 401/403, sesión válida, roles y configuración.

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
