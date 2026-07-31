# Prompt maestro — completar el MVP mediante PR separadas

Actúa como Principal Product Engineer y usa el subagente `mvp-orchestrator`.

Repositorio:

`c:\Users\Sergio\workspaces\peluqueria`

Objetivo: ejecutar todo el recovery plan aprobado, dejando una pull request por fase/subfase y sin fusionar ninguna.

## Condición inicial

La rama `chore/agent-governance` debe existir local o remotamente. Si la PR no está fusionada, úsala como predecesora del stack.

## Reglas absolutas

- Nunca trabajes directamente en main.
- Nunca push a main.
- Nunca merges o cierres PR.
- Nunca force push.
- Cada fase tiene su rama.
- Todas las PR apuntan a main.
- Cada nueva rama nace de la rama predecesora cuando esta no está fusionada.
- No menciones Cursor en commit, PR title/body ni change records.
- No inventes credenciales.
- No amplíes scope.
- Documenta todos los cambios.
- Usa Draft PR cuando falte verificación externa.
- Continúa con trabajo independiente cuando exista un bloqueo externo.
- Registra cada ejecución en `docs/agent-runs/`.

## Secuencia y ramas

1. 1A `feature/persistence-foundation`
2. 1B `feature/master-data-persistence`
3. 1C `security/secure-photo-storage`
4. 1D `feature/operational-persistence`
5. 2A `security/admin-auth-api-protection`
6. 2B `fix/booking-transaction-consistency`
7. 2C `feature/idempotent-confirmation-expiration`
8. 2D `update/catalog-production-assets`
9. 3A `chore/netlify-preview-bootstrap`
10. 3B `feature/replicate-async-webhook`
11. 3C `feature/replicate-storage-limits`
12. 4 `feature/durable-demo-inbox`
13. 5 `security/privacy-retention-logging`
14. 6 `test/ai-benchmark`
15. 7 `test/e2e-a11y-ci`
16. 8 `release/netlify-production`
17. 9 `test/production-dod-smoke`
18. Final `fix/mvp-final-hardening`

## Ciclo por fase

Para cada fase:

1. Invoca `principal-planner`.
2. Invoca `solution-architect` cuando afecte arquitectura.
3. Crea branch y change record.
4. Implementa mediante especialistas.
5. Ejecuta tests.
6. Invoca `security-privacy-auditor` cuando aplique.
7. Invoca `documentation-governor`.
8. Invoca `independent-verifier`.
9. Corrige hallazgos dentro del scope.
10. Ejecuta `check-pr-readiness`.
11. Crea commits convencionales.
12. Push sin force.
13. Abre PR contra main.
14. Registra URL, estado y dependencia.
15. Pasa a la siguiente fase sin fusionar.

## Netlify

En 3A y 8 usa la skill `netlify-portfolio-deployment`.

Debes localizar el portfolio del mismo workspace y reutilizar su mecanismo, sin copiar secretos ni estado de site.

## Salida final

Crea `docs/autonomous-recovery-summary.md` con:

- todas las ramas;
- PR URLs;
- merge order;
- checks;
- bloqueos;
- operator actions;
- estado DoD;
- P0/P1 restantes.

No declares terminado lo no verificado. No fusiones nada.
