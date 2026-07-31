# Prompt — instalar gobierno de agentes

Trabaja en:

`c:\Users\Sergio\workspaces\peluqueria`

Instala y adapta el paquete de gobierno proporcionado por Sergio.

## Rama

`chore/agent-governance`

Debe nacer desde `origin/main`.

## Alcance

- `.cursor/**`
- `.githooks/**`
- `.github/pull_request_template.md`
- `.github/workflows/governance.yml`
- `AGENTS.md`
- `.cursorignore`
- `.cursorindexingignore`
- documentos operativos incluidos en el paquete

## Procedimiento

1. Inspecciona archivos existentes y fusiona contenido; no sobrescribas ciegamente.
2. Verifica formatos actuales de rules, agents, skills y hooks.
3. Activa:
   `git config core.hooksPath .githooks`
4. Ejecuta validadores manualmente.
5. Comprueba que:
   - commit en main queda bloqueado tras existir origin/main;
   - commit con referencia a Cursor se rechaza;
   - branch inválida se rechaza;
   - docs gate funciona con un fixture temporal y luego limpia el fixture.
6. Comprueba `gh auth status`.
7. Si existe autenticación y permisos de administración, ejecuta:
   `.cursor/scripts/configure-github-main-protection.ps1`
   Si GitHub rechaza la operación, no la fuerces: actualiza `docs/operator-actions.md`.
8. Actualiza README/documentación del proyecto solo cuando sea necesario.
9. Crea change record.
10. Ejecuta checks disponibles.
11. Commits sugeridos:
   - `chore(governance): add agent workflow controls`
   - `ci(governance): enforce pull request quality gates`
   - `docs(governance): document branch and agent operations`
12. Push.
13. Abre PR contra main.
14. No la fusiones ni cierres.

Devuelve URL, resultados y estado de protección remota.
