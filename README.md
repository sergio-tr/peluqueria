# Peluquería Nowi

Repositorio del MVP de peluquería con prueba virtual de corte y reservas.

Package: `peluqueria-nowi`  
Ruta canónica: `c:\Users\Sergio\workspaces\peluqueria`  
Rama protegida: `main`

## Getting started

```bash
npm install
npm run dev
```

## Agent governance

This repository uses versioned agent and Git controls.

- Agent instructions: [`AGENTS.md`](./AGENTS.md)
- Install / setup: [`INSTALL.md`](./INSTALL.md)
- Git workflow: [`docs/git-workflow.md`](./docs/git-workflow.md)
- Agent operations: [`docs/agent-operations.md`](./docs/agent-operations.md)
- Branch protection: [`docs/github-branch-protection.md`](./docs/github-branch-protection.md)

Activate local hooks after clone:

```powershell
git config core.hooksPath .githooks
```

Do not commit directly to `main` once `origin/main` exists. Open a pull request instead.

## Product docs

See [`docs/`](./docs/) for product brief, architecture, recovery plan, and ADRs.
