---
name: testing
description: Cómo escribir tests que prueben algo real en este repo — fechas dentro del rango mock, zona horaria fija y ubicación de los tests.
scope:
  - backend/tests/**
  - frontend/src/**/*.test.ts
  - frontend/src/**/*.test.tsx
  - frontend/vite.config.ts
---

# Testing

## Alcance

Tests de backend (pytest + `TestClient`) y de frontend (Vitest), y la configuración de Vitest en `vite.config.ts`.

## Por qué

Este repo tuvo dos tests que **pasaban sin proteger nada**:

- El test de `/comparison` usaba marzo 2025, fuera del rango de datos: comparaba 0 contra 0.
- El test del bug de zona horaria solo fallaba al oeste de UTC; en Docker (UTC) no habría detectado una regresión.

## Guía

1. **(R15) Los tests sobre datos mock usan fechas dentro del rango real.** Obtén el rango de `GET /api/metrics/facets` y calcula la ventana a partir de él. Para comparar periodos completos, usa el mes **anterior** a `max_date`: el último mes está incompleto.
   - Además de comprobar las claves de la respuesta, comprueba **al menos un valor distinto de cero** y una relación entre campos (p. ej. `delta_abs == current - previous`).
2. **(R16) Los tests del frontend corren con `TZ=America/Santiago`**, fijado en `vite.config.ts` → `test.env.TZ`. No lo quites: hace que los bugs de fechas fallen en cualquier máquina, incluidos contenedores en UTC. Para fechas `YYYY-MM-DD` de la API, no uses `new Date()` para extraer año o mes; lee el string.
3. **(R17) Dónde van los tests:**
   - Backend: `backend/tests/test_*.py`. Usa `TestClient(app)` para endpoints y llamadas directas para funciones puras.
   - Frontend: `*.test.ts` junto al archivo que prueba (`src/lib/financial-utils.test.ts`).
   - Todo cambio en `src/lib/` o en `backend/app/routes.py` lleva un test que **falle sin el cambio**.
4. **(R18) Tests de componentes:** antes de escribir el primero, instala `jsdom` y configura `test.environment: "jsdom"` en `vite.config.ts`. Hoy Vitest corre en entorno Node, sin DOM.

## Cómo comprobar

```bash
# backend/
.venv/bin/python -m pytest
# frontend/
npm test
```

Para confirmar que un test nuevo protege algo: revierte temporalmente el cambio de código (`git stash push <archivo>`), comprueba que el test falla y restaura (`git stash pop`).

## Validación

- R15: el test de `/comparison` ahora deriva el mes de `facets` y comprueba valores ≠ 0.
- R16: con el bug de zona horaria reintroducido, el test falla en Docker (UTC); con el código correcto, pasan 8/8.

Detalle en `analysis/phase-3-rule-validation.md`.
