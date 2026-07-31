---
name: netlify-portfolio-deployment
description: Reutiliza el mecanismo de despliegue Netlify del portfolio existente en el mismo workspace sin copiar secretos.
paths:
  - "netlify/**"
  - "netlify.toml"
  - ".github/workflows/**"
  - "docs/deployment.md"
---

# Netlify Portfolio Deployment

1. Busca repositorios hermanos bajo `c:\Users\Sergio\workspaces`.
2. Excluye el repo `peluqueria`.
3. Localiza candidatos con `netlify.toml`, scripts Netlify, workflow o documentación.
4. Identifica el portfolio mediante README, package name y remote.
5. Registra evidencia del candidato seleccionado.
6. Reutiliza:
   - mecanismo de login;
   - comandos;
   - patrón de preview/production;
   - configuración de build compatible;
   - forma de documentar rollback.
7. No copies:
   - `.netlify/state.json`;
   - site ID;
   - tokens;
   - env;
   - dominios;
   - secretos.
8. Adapta al proyecto y verifica.
