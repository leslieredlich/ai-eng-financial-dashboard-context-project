---
name: tooling
description: Configuración de TypeScript, versiones de Node y Python, dependencias, formato y CI.
scope:
  - frontend/package.json
  - frontend/tsconfig*.json
  - frontend/.nvmrc
  - backend/requirements.txt
  - backend/Dockerfile
  - docker-compose.yml
---

# Tooling y entorno

## Alcance

Configuración de compilación, versiones de runtime, dependencias y contenedores.

## Por qué

En la Fase 1, el frontend no arrancaba localmente porque Node 20.12 es menor de lo que exige Vite 8, y nada lo advertía. TypeScript corría sin `strict`, y `requirements.txt` no fija versiones: una instalación nueva ya trae avisos de deprecación (`httpx` en el `TestClient`).

## Guía

1. **(R22) TypeScript estricto.** `"strict": true` está activo en `tsconfig.app.json` y `tsconfig.node.json`. No lo desactives, ni silencies errores con `any`, `@ts-ignore` o `!`; tipa el valor o compruébalo antes.
2. **(R24) Versión de Node:** mínimo 20.19 (`"engines"` en `package.json`); la recomendada es la de `frontend/.nvmrc` (24, la misma que `frontend/Dockerfile`). Si cambias una, actualiza las tres.
3. **Versión de Python:** el código usa `X | None`, así que requiere 3.10+. Docker usa 3.13 (`backend/Dockerfile`).
4. **(R23) Dependencias:** al añadir o actualizar una dependencia de Python, fija la versión (`paquete==x.y.z`). Pendiente: fijar las existentes y separar las de desarrollo (`pytest`, `pytest-cov`, `debugpy`) en `requirements-dev.txt`.
5. **El contenedor backend es solo para desarrollo:** arranca con `debugpy` y `--reload` (`backend/Dockerfile:12`). No lo uses como imagen de producción.
6. **(R14) Formato:** no hay Prettier y el estilo está mezclado (comillas simples y dobles). No reformatees archivos que no tocas; si se adopta Prettier, se formatea todo en un commit aparte (`style:`).
7. **(R25) CI:** no existe. Hasta que exista, ejecuta los comandos de *Cómo comprobar* antes de cada commit.

## Cómo comprobar

```bash
# frontend/
node -v                       # >= 20.19
npx tsc -b && npm run lint && npm test
# backend/
.venv/bin/python -m pytest
```

## Validación

R22 y R24 aplicadas: se activó `strict` (0 errores de `tsc -b`) y se añadieron `engines` y `.nvmrc`. R14, R23 y R25 quedan como guía: aplicarlas implica reformatear todo el frontend o cambiar dependencias, fuera del alcance de esta fase. Detalle en `analysis/phase-3-rule-validation.md`.
