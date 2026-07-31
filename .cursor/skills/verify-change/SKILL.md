---
name: verify-change
description: Ejecuta el gate completo de calidad y comprueba criterios de aceptación antes de commit y PR.
---

# Verify Change

1. Ejecuta `.cursor/scripts/check-pr-readiness.mjs`.
2. Ejecuta los scripts de package disponibles:
   - lint;
   - typecheck;
   - test;
   - build.
3. Ejecuta tests de integración específicos.
4. Revisa `git diff --check`.
5. Busca:
   - secrets;
   - defaults inseguros;
   - imports de memoryDb;
   - mock en preview/prod;
   - PII y signed URLs en logs;
   - documentación faltante.
6. Invoca independent verifier.
7. No marques passed lo no ejecutado.
