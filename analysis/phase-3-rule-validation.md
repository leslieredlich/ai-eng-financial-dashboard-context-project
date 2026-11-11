# Fase 3 — Validación de reglas

En esta fase convertí las propuestas de la Fase 2 en reglas dentro de `.agents/rules/` y comprobé que sirven de verdad: una regla que no cambia cómo se trabaja es solo una opinión escrita. Por eso cada archivo de reglas se probó con una tarea real, hecha con el agente. Lo más útil que entendí fue que una regla se vuelve confiable cuando un test la protege: el test de contrato, por ejemplo, falla si alguien cambia un tipo en el backend y olvida cambiarlo en el frontend. Las reglas que no pude validar quedaron marcadas como pendientes, sin fingir que funcionan.

Cada archivo de `.agents/rules/` se validó con al menos una tarea pequeña y real en este repo. Para cada una: qué regla dirigió el cambio, cómo se comprobó y qué se refinó en la regla después de aplicarla.

## Resumen

| Archivo de reglas | Regla probada | Tarea real | Resultado |
|---|---|---|---|
| `backend.md` | R2 | `generate_mock_movements` usa `random.Random(seed)` en lugar de `random.seed()` global | ✅ Datos idénticos; test nuevo falla con el código anterior |
| `testing.md` | R15 | El test de `/comparison` deriva el mes de `facets` y comprueba valores ≠ 0 | ✅ Ya no pasa con 0 contra 0 |
| `testing.md` | R16 | `TZ=America/Santiago` fijado en Vitest (`vite.config.ts`) | ✅ El bug de zona horaria se detecta incluso en Docker (UTC) |
| `domain-contract.md` | R1 | Nuevo `backend/tests/test_contract.py` compara los enums de backend y frontend | ✅ Detecta un desajuste simulado |
| `frontend.md` | R13 | Mensaje de error de `App.tsx` traducido al inglés | ✅ Ningún texto de UI en español |
| `tooling.md` | R22, R24 | `"strict": true` en ambos `tsconfig`; `engines` + `.nvmrc` | ✅ `tsc -b` con 0 errores |
| `docs-and-commits.md` | R20, R21 | Secciones "sin Docker" y "Tests" en los dos README; commit con Conventional Commits | ✅ Comandos ejecutados tal como están escritos |

## Detalle

### `backend.md` — R2: aleatoriedad aislada

- **Cambio:** `random.Random(seed)` se crea en `generate_mock_movements` y se pasa a `_build_movement(rng, …)`.
- **Comprobación:**
  - Hash SHA-256 de los 360 movimientos: `833dda429661f374` **antes y después** (el dashboard muestra lo mismo).
  - Nuevo test `test_generate_mock_movements_does_not_reseed_global_random`: pasa con el cambio y **falla** al revertir `routes.py` con `git stash`.
  - `pytest`: 16/16.
- **Refinamiento:** la regla de la Fase 2 decía solo "usa `random.Random(seed)`". Al aplicarla se vio que también hay que **pasar la instancia a los helpers** y **verificar que los datos no cambian**; se añadió el comando de hash a *Cómo comprobar*.

### `testing.md` — R15: tests con fechas reales

- **Cambio:** el test toma `max_date` de `/api/metrics/facets`, usa el mes completo anterior y comprueba `current_period != 0`, `previous_period != 0` y `delta_abs == current - previous`.
- **Comprobación:** con las fechas antiguas (`2025-03`) la API devuelve `{current: 0.0, previous: 0.0}`, así que las nuevas aserciones habrían fallado; con la ventana derivada, pasa.
- **Refinamiento:** se añadió "usa el mes **anterior** a `max_date`" porque el último mes del rango está incompleto (`max_date` = `2026-10-28`).

### `testing.md` — R16: zona horaria fija en tests

- **Cambio:** `test: { env: { TZ: "America/Santiago" } }` en `vite.config.ts`, con `/// <reference types="vitest/config" />` para tipar la clave `test`.
- **Comprobación:** se reintrodujo temporalmente el bug (`new Date(isoDate)`) y se ejecutó Vitest en el contenedor (zona `UTC`): **2 tests fallan**. Con el código correcto: 8/8. El archivo se restauró y `git diff` lo confirmó.
- **Refinamiento:** la propuesta decía "fija la zona horaria". Ahora la regla indica **dónde** (`test.env.TZ`), **que no se quite**, y la causa concreta (`new Date()` sobre `YYYY-MM-DD`).

### `domain-contract.md` — R1: tipos sincronizados

- **Cambio:** `backend/tests/test_contract.py` lee `frontend/src/lib/financial-types.ts` y compara cada unión con `typing.get_args()` de los `Literal` del backend.
- **Comprobación:** 3/3 en verde. Al añadir `'taxes'` solo en el frontend: `AssertionError … Extra items in the left set`. Archivo restaurado.
- **Refinamiento:** al ejecutarlo dentro del contenedor backend se vio que solo monta `backend/`. El test ahora **se omite** allí (`16 passed, 3 skipped`), y la regla y los README avisan de que hay que correr `pytest` desde el repo completo.

### `frontend.md` — R13: textos de UI en inglés

- **Cambio:** `"No se pudo cargar la informacion financiera…"` → `"Could not load financial data. Check that the backend API is running."`
- **Comprobación:** `grep -rnE "[áéíóúñ¿¡]" src --include=*.tsx` sin resultados; `tsc -b`, `npm run lint` y `npm test` (8/8) correctos.
- **Refinamiento:** se añadió el `grep` como verificación rápida.

### `tooling.md` — R22 y R24: TypeScript estricto y versión de Node

- **Cambio:** `"strict": true` en `tsconfig.app.json` y `tsconfig.node.json`; `"engines": { "node": ">=20.19.0" }` en `package.json`; `frontend/.nvmrc` = `24`.
- **Comprobación:** `npx tsc -b` sin errores con Node 26.13 local.
- **Refinamiento:** se añadió "si cambias una versión de Node, actualiza las tres" (`engines`, `.nvmrc` y `frontend/Dockerfile`).

### `docs-and-commits.md` — R20 y R21: README y commits

- **Cambio:** secciones "Cómo ejecutar sin Docker" / "How to run without Docker" y "Tests" en ambos README.
- **Comprobación:** `.venv\Scripts\python -m pytest` → 19 passed en local; en el contenedor → 16 passed, 3 skipped, como indica el README. Ambos README tienen 5 secciones `##`.
- **Refinamiento:** al editar solo `README.es.md` se vio que existe la versión en inglés; la regla ahora exige **cambiar los dos en el mismo commit**.

## Reglas sin tarea de validación en esta fase

| Regla | Motivo |
|---|---|
| R3 (filtros en `filter_movements`), R5 (`lib/api.ts`), R9 (CORS) | Se activan con un endpoint nuevo, un segundo `fetch` o autenticación; nada de eso existe todavía. Quedan como guía condicional |
| R7 (tokens de color), R8 (shadcn) | No se añadieron colores ni componentes; hacerlo solo para validar sería un cambio visual, que la consigna excluye |
| R14 (Prettier), R23 (fijar dependencias), R25 (CI) | Implican reformatear todo el frontend o cambiar dependencias: un refactor mayor, fuera del alcance |

## Comprobación final

| Comando | Resultado |
|---|---|
| `backend/.venv/Scripts/python -m pytest` | 19 passed |
| `docker compose run backend python -m pytest` | 16 passed, 3 skipped |
| `npx tsc -b` | 0 errores (`strict`) |
| `npm run lint` | sin errores |
| `npm test` (local y Docker UTC) | 8 passed |
