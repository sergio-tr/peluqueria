# Prompt — Fase 3A: Bootstrap remoto Netlify/Supabase

Repositorio:

`c:\Users\Sergio\workspaces\peluqueria`

Rama obligatoria:

`chore/netlify-preview-bootstrap`

Determina la rama predecesora en `docs/agent-operations.md`.

Crea la rama desde su predecesora si esta todavía no ha sido fusionada. La pull request debe apuntar siempre a `main`.

## Alcance

Crea la infraestructura remota mínima de preview.

Usa el mecanismo del portfolio del mismo workspace.

Incluye:
- identificación documentada del portfolio;
- Supabase remoto;
- Netlify site/preview;
- env preview sin defaults;
- gate activo;
- HTTPS estable;
- health checks;
- migraciones remotas;
- cron/webhook endpoints alcanzables, aunque la lógica completa llegue después.

No copies secrets/site IDs del portfolio.

Si falta login o credencial, deja Draft PR y operator action.

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
