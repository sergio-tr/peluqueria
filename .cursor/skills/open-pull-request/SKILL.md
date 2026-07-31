---
name: open-pull-request
description: Crea commits convencionales, push y una pull request contra main sin fusionarla.
disable-model-invocation: false
---

# Open Pull Request

1. Confirma que la rama no es main.
2. Ejecuta validadores de rama, commits y documentación.
3. Crea commits atómicos con Conventional Commits.
4. Prohibido mencionar Cursor.
5. Push sin force.
6. Abre PR con base `main`.
7. Si la rama depende de otra sin fusionar, indícalo en el cuerpo.
8. Usa Draft si hay checks o credenciales pendientes.
9. No merges, cierres ni borres la PR.
10. Devuelve la URL.
