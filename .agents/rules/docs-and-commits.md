---
name: docs-and-commits
description: Mantener los README bilingües al día, las rutas de agentes válidas y los commits con Conventional Commits.
scope:
  - README.md
  - README.es.md
  - AGENTS.md
  - .agents/**
  - memory-bank/**
---

# Documentación y commits

## Alcance

README, instrucciones para agentes y mensajes de commit.

## Por qué

- El README existe en dos idiomas (`README.md` y `README.es.md`) con el mismo contenido. Es fácil actualizar uno y olvidar el otro.
- `AGENTS.md` obliga a leer `.agents/rules`, `.agents/skills` y `memory-bank/`. Si una ruta no existe o está desactualizada, los agentes trabajan sin contexto.
- El historial mezcla mensajes libres (`Add metrics facets endpoint…`) con Conventional Commits (`feat:`, `fix:`, `docs:`).

## Guía

1. **(R20) Cambia `README.md` y `README.es.md` en el mismo commit**, con la misma estructura de secciones. Cualquier comando nuevo de setup o de tests se documenta en ambos.
2. **(R19) Las rutas que cita `AGENTS.md` deben existir.** Al añadir una regla, crea el archivo en `.agents/rules/` y añádelo a la tabla de `.agents/rules/README.md`. Si una regla cita un archivo o una línea que cambias, actualiza la cita.
3. **(R21) Mensajes de commit con Conventional Commits:** `tipo: descripción en imperativo`. Tipos: `feat`, `fix`, `docs`, `test`, `refactor`, `style`, `chore`. Si el commit no cabe en un solo tipo, probablemente debería ser varios commits.
4. Las afirmaciones de la documentación deben poder comprobarse en el repo (archivo, comando o URL local). No documentes funcionalidades ni planes que no existan.
5. **`memory-bank/` describe el estado real.** Si tu cambio altera algo que describe (endpoints, versiones, comandos, gaps, prioridades), actualiza el archivo afectado y su fecha de *Última verificación* en el mismo commit.

## Cómo comprobar

```bash
# mismo número de secciones en ambos README (hoy: 5 y 5)
grep -c '^## ' README.md README.es.md
# formato de los últimos commits
git log --format=%s -5
```

## Validación

R20 aplicada: se añadió "Cómo ejecutar sin Docker" y "Tests" a los dos README, y sus comandos se ejecutaron tal como están escritos. R19: la Fase 3 creó `.agents/rules/` y la Fase 4 `memory-bank/`, así que las rutas que cita `AGENTS.md` existen (salvo `.agents/skills/`, aún sin skills). R21: el commit de esta fase usa `feat:`. Detalle en `analysis/phase-3-rule-validation.md`.
