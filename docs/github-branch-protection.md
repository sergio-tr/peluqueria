# GitHub protection for main

Repository files cannot fully prevent an actor with administrative permissions from bypassing Git rules. Configure a branch ruleset for `main`.

## Recommended rules

- Require a pull request before merging.
- Require status checks:
  - `governance`
  - `quality`
- Require conversation resolution.
- Block force pushes.
- Block branch deletion.
- Include administrators.
- Do not grant agents bypass permission.
- Keep merge commits enabled while the recovery PR stack is active.
- Disable automatic branch deletion until the stack is complete.

## Human approval model

Sergio reviews and performs the merge from the GitHub web interface.

Do not require an approval count that prevents the repository owner from merging their own PR, unless another human reviewer is available. The invariant is PR-only delivery plus manual web merge, reinforced by status checks.

## Verification

Attempting to push directly to `main` must fail remotely after the ruleset is active.

## Configuración automatizada opcional

Con GitHub CLI autenticado y permisos de administración:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .cursor/scripts/configure-github-main-protection.ps1
```

El script no concede bypass a agentes, mantiene merge commits habilitados y exige los checks `governance` y `quality`.

Si la API devuelve un error por permisos o plan, configura las reglas manualmente y registra el bloqueo en `docs/operator-actions.md`.
