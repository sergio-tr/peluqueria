# Instalación del gobierno de agentes — Peluquería Nowi

Repositorio objetivo:

`c:\Users\Sergio\workspaces\peluqueria`

Package name:

`peluqueria-nowi`

## Orden de ejecución

1. Abre el repositorio real en Cursor.
2. Ejecuta el contenido de `.cursor/prompts/00-bootstrap-main.md`.
3. Ejecuta el contenido de `.cursor/prompts/01-install-governance.md`.
4. Revisa en GitHub la PR `chore/agent-governance`.
5. Para dejar al agente trabajando, ejecuta `.cursor/prompts/02-autonomous-mvp-orchestrator.md`.
6. Las PR se revisan y fusionan desde la web, en el orden indicado en `docs/agent-operations.md`.

## Instalación manual de estos archivos

Copia el contenido de este paquete en la raíz del repositorio, preservando rutas.

No copies secretos. No sobrescribas documentación existente sin fusionar el contenido cuidadosamente.

Después activa los Git hooks versionados:

```powershell
git config core.hooksPath .githooks
```

Comprueba:

```powershell
git config --get core.hooksPath
node .cursor/scripts/validate-branch-name.mjs "feature/example-change"
node .cursor/scripts/validate-commit-message.mjs --text "feat(example): add sample change"
```

## Protección remota de `main`

Los ficheros del repositorio impiden muchas operaciones accidentales, pero la protección definitiva debe configurarse en GitHub.

Sigue `docs/github-branch-protection.md`.

Cuando `gh` tenga permisos de administración, el agente puede ejecutar:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .cursor/scripts/configure-github-main-protection.ps1
```

Si la cuenta o el plan no permite configurar la protección mediante API, debe dejar la acción pendiente para el usuario.

## Integraciones externas

El agente nunca inventará credenciales ni copiará secretos del portfolio.

Para Netlify debe inspeccionar el portfolio existente dentro de `c:\Users\Sergio\workspaces`, reutilizar su mecanismo operativo y adaptar únicamente la configuración no secreta. Está prohibido copiar:

- site IDs;
- tokens;
- variables privadas;
- dominios;
- `.netlify/state.json`;
- credenciales de Supabase o Replicate.
