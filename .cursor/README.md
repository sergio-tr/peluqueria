# Configuración de Cursor del proyecto

## Directorios nativos

- `rules/`: Project Rules `.mdc`
- `agents/`: subagentes especializados
- `skills/`: workflows reutilizables
- `hooks.json`: hooks deterministas
- `BUGBOT.md`: reglas de revisión de PR
- `mcp.json`: servidores MCP del proyecto

## Directorios auxiliares

- `scripts/`: validaciones versionadas
- `prompts/`: prompts operativos para el usuario
- `hooks/`: scripts ejecutados por hooks

`prompts/` no es una API nativa de Cursor. Es una biblioteca versionada para copiar y ejecutar de forma controlada.

## Principio de autoridad

Las reglas orientan al modelo. Los Git hooks y CI hacen cumplir los invariantes críticos.

## MCP

`mcp.json` se mantiene vacío deliberadamente para evitar dependencias y secretos implícitos. Usa OAuth o variables de entorno al añadir servidores. Nunca escribas tokens en el fichero.
