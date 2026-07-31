---
name: start-change
description: Inicia cualquier cambio con inspección Git, selección de rama, change record y baseline de tests.
---

# Start Change

1. Confirma el repositorio y lee `AGENTS.md`.
2. Ejecuta:
   - `git status`
   - `git branch --show-current`
   - `git remote -v`
   - `git fetch --all --prune`
3. Determina la rama predecesora según `docs/agent-operations.md`.
4. Crea una rama nueva con prefijo permitido.
5. Nunca edites main.
6. Crea `docs/changes/YYYY-MM-DD-<slug>.md` desde la plantilla.
7. Registra:
   - objetivo;
   - scope;
   - fase recovery;
   - dependencia de stack;
   - baseline de tests.
8. No implementes hasta que la rama y el registro existan.
