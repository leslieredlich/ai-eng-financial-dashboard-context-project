# Memory bank

Contexto persistente del proyecto para personas y agentes. Se lee al empezar cualquier tarea (lo exige `AGENTS.md`) y se actualiza cuando algo de lo que describe cambia.

| Archivo | Responde a |
|---|---|
| [product-overview.md](product-overview.md) | ¿Qué es esto, qué hace y qué **no** hace? |
| [tech-stack.md](tech-stack.md) | ¿Con qué está hecho, cómo se conecta y cómo se ejecuta? |
| [current-state.md](current-state.md) | ¿Qué funciona hoy, qué está roto o pendiente y qué sigue? |

Las reglas de trabajo (qué hacer y qué evitar al cambiar código) **no** están aquí: están en [`.agents/rules/`](../.agents/rules/README.md).

## Reglas de esta carpeta

1. **Cada afirmación tiene evidencia** verificable en el repo: un archivo (con línea cuando ayuda), un comando o una URL local.
2. **Nada inventado.** Si algo no se puede comprobar en el repo (usuarios reales, despliegue, planes de producto), se escribe como *desconocido*, no se supone.
3. **Las prioridades salen de los hallazgos documentados**, no de un roadmap: el repo no tiene roadmap.
4. Al cambiar algo que describe esta carpeta, actualiza el archivo afectado en el mismo commit y la línea *Última verificación*.

**Última verificación:** 2026-11-11, sobre el commit `21b4d71` (rama `main`).
