# Prompt — bootstrap mínimo de main

Actúa como responsable Git del repositorio.

Repositorio real:

`c:\Users\Sergio\workspaces\peluqueria`

Objetivo: crear o normalizar `main` con el estado actual más sencillo posible, sin implementar features ni recovery.

## Reglas

- Inspecciona primero Git, commits, ramas, remote y working tree.
- No uses force push.
- No borres historia.
- No inventes remote.
- No incluyas cambios funcionales nuevos.
- No menciones Cursor en commits.
- Esta es la única operación autorizada para crear `main` directamente.

## Procedimiento

1. Confirma que estás en el repo real.
2. Ejecuta `git status`, `git log --oneline --decorate -20`, `git branch -a`, `git remote -v`.
3. Si `main` ya existe en origin:
   - no hagas commits ni push sobre ella;
   - solo informa del estado;
   - termina.
4. Si existe historia local pero no `origin/main`:
   - crea `main` apuntando al commit canónico actual;
   - no alteres los commits;
   - push inicial `main` sin force.
5. Si el repo no tiene commits:
   - revisa que no haya secretos ni outputs generados;
   - crea un único baseline con:
     `chore: establish protected project baseline`
   - crea/push `main`.
6. Si hay cambios sin commit en un repo con historia:
   - no los mezcles silenciosamente en main;
   - crea un informe `docs/bootstrap-uncommitted-state.md`;
   - conserva los cambios;
   - crea main desde el último commit canónico.
7. No implementes `.cursor` todavía.
8. Devuelve:
   - commit de main;
   - remote;
   - working tree;
   - cualquier bloqueo.

Detente.
