# Exploración de la API — base para las specs

**Fecha:** 2026-11-12 · **Rama:** `feature/frontend-specs` · **Fuente:** `GET /openapi.json` (lo que muestra `/docs`), `backend/app/routes.py` y llamadas reales con `curl` al backend local.

Este archivo es la Fase 1: explorar antes de especificar. Las specs de tipos, componentes y contrato de datos de las fases siguientes deben respetar lo que está aquí. Cada afirmación del PM está marcada como:

- ✅ verificada en la API
- ❌ incorrecta: la API hace otra cosa
- ❓ la API no la cubre

Cada desajuste se resuelve en la spec, no cambiando el backend.

## Datos de referencia

- Todos los endpoints son `GET` y devuelven JSON.
- Los datos son 360 movimientos simulados (semilla fija 42), del 2025-11-01 al 2026-10-28, solo en los días 1 a 28 de cada mes.
- Valores permitidos:
  - `operation_type`: `income` | `outcome`
  - `category`: `suppliers` | `sales` | `operational` | `administrative` | `others`
  - `business_type`: `B2B` | `B2C`, en mayúsculas.
- Las fechas van como `AAAA-MM-DD`.
- Un valor inválido devuelve `422` con un arreglo `detail[]` que indica el campo que falló.

## Patrón de fetch existente en el frontend

- Hoy hay un solo `fetch`: `App.tsx:19-25`, a `/api/metrics`, sin parámetros. Usa como base `import.meta.env.VITE_API_BASE_URL ?? ""` y una ruta relativa, que el proxy de Vite resuelve.
- Cuando se use un segundo endpoint, los `fetch` pasan a `src/lib/api.ts` (regla R5, `.agents/rules/frontend.md`).
- Los componentes no hacen `fetch` ni calculan: reciben datos y `loading` por props. Los cálculos van en funciones puras de `src/lib/` con su test (regla R4).
- `src/lib/financial-types.ts` solo tiene `FinancialMovement`. Faltan los tipos `MetricsFacets` y `MetricsAlert`, y también `TopCategoryItem` para la Funcionalidad 3. Deben llevar los mismos nombres de campo que la API.
- Ningún `fetch` envía parámetros de query todavía. Las tres funcionalidades los necesitan.

## Funcionalidad 1 — Filtro de rango de fechas

Endpoints: `GET /api/metrics/facets` y `GET /api/metrics?start_date=&end_date=`.

`/facets` responde: `{operation_types[], business_types[], categories[], min_date, max_date}`.

| Lo que dice el PM | Estado | Lo que hace la API | Decisión para la spec |
| --- | --- | --- | --- |
| Fechas en formato YYYY-MM-DD | ✅ | `start_date` y `end_date` son de tipo `date`. `01-10-2026` → `422` | Envío la fecha tal como la entrega el input de fecha (`AAAA-MM-DD`). |
| Ambos opcionales; si están vacíos, se muestra todo | ✅ con matiz | Sin parámetros llegan los 360 movimientos. Pero `start_date=` vacío → `422` | Si un input está vacío, **no se envía** su parámetro. |
| "Extensión de filtros sobre el endpoint de métricas existente" | ❌ | `/api/metrics` ya acepta `start_date` y `end_date` | No hay nada que extender en el backend: el fetch existente solo agrega los parámetros. |
| Filtrar todos los datos de la página | ✅ | Los KPIs y los gráficos salen de un solo fetch (`App.tsx:20`) | Al cambiar una fecha se vuelve a pedir y se recalculan los KPIs, los gráficos y la etiqueta de periodo del header. |
| Mostrar el rango disponible | ✅ | `/facets` → `min_date` 2025-11-01 y `max_date` 2026-10-28. No acepta filtros | Muestro "Datos disponibles: 2025-11-01 a 2026-10-28" y uso esas fechas como `min` y `max` de los inputs. |
| Inicio posterior al fin (no lo menciona) | ❓ | La API no lo valida: devuelve `[]` con `200` | La UI muestra un error y no hace la llamada. |
| Rango sin datos (no lo menciona) | ❓ | `start_date=2030-01-01` → `[]` con `200` | Estado vacío: "No hay movimientos en este rango". |

## Funcionalidad 2 — Tabla de alertas de gasto

Endpoint: `GET /api/metrics/alerts?threshold=&group_by=month&start_date=&end_date=`.

Responde: `[{period, outcome_total, baseline_average, increase_ratio}]`.

| Lo que dice el PM | Estado | Lo que hace la API | Decisión para la spec |
| --- | --- | --- | --- |
| Columna "período" | ✅ | `period` en formato `AAAA-MM` (por defecto `group_by=month`) | Envío `group_by=month` de forma explícita. |
| Columna "outcome registrado" | ✅ | `outcome_total` | Se muestra como monto. |
| Columna "media móvil de los 3 períodos anteriores" | ❌ | `baseline_average` es el promedio de **todos** los periodos anteriores dentro del rango. En 2026-03 vale 55334.29 (promedio de 4 meses); la media de 3 sería 59977.58 | La columna se llama "Promedio de periodos anteriores". Si el PM exige la media de 3, hay que cambiar el backend (pregunta abierta). |
| Columna "incremento porcentual" | ✅ con conversión | `increase_ratio` es una proporción (`0.5917`) | Muestro `increase_ratio × 100` con un decimal: 59,2 %. |
| Umbral entre 0.01 y 1.0, por defecto 0.3 | ❌ parcial | El valor por defecto 0.3 es correcto. Pero la API acepta cualquier valor ≥ 0, sin máximo: `0` incluye 2026-07 (0,39 %), `1.5` → `[]`, `-0.1` → `422` | Input numérico con `min=0.01`, `max=1` y `step=0.01`. La UI valida y no envía valores fuera de ese rango. |
| Gasto que "subió de forma inesperada" | ✅ | Solo hay alerta si `increase_ratio` es **mayor** que el umbral; si es igual, no cuenta | La spec dice "mayor que el umbral". |
| Mensaje explícito si no hay anomalías | ✅ | Sin alertas → `[]` con `200` | La tabla muestra: "No hay periodos con un aumento de gasto mayor a X %". |
| Respeta el rango de fechas de la Funcionalidad 1 | ✅ con efecto | Acepta `start_date` y `end_date`, pero el promedio cambia con el rango. Con `start_date=2026-03-01`, el promedio de 2026-06 pasa de 57416.5 a 60192.76. El primer mes del rango nunca genera alerta | La spec advierte que cambiar el rango cambia las alertas. |

## Funcionalidad 3 — Comparativa B2B vs B2C

Endpoints: `GET /api/metrics/categories/top?operation_type=income&limit=5&business_type=` (una llamada por línea de negocio) y `GET /api/metrics/facets`.

`/categories/top` responde: `[{category, operation_type, total_amount}]`, ordenado de mayor a menor.

| Lo que dice el PM | Estado | Lo que hace la API | Decisión para la spec |
| --- | --- | --- | --- |
| Top 5 de categorías de ingreso por línea | ❌ en los datos | Solo existen 2 categorías de ingreso (`sales` y `others`): B2B y B2C devuelven 2 filas cada uno. B2B en octubre de 2026 devuelve 1 | La tabla muestra de 0 a 5 filas, sin huecos, con un estado vacío si llegan 0. |
| Filtrar por línea de negocio | ✅ | `business_type=B2B` o `B2C`. `b2b` en minúsculas → `422` | Dos llamadas, una por línea. |
| Porcentaje sobre el total del grupo | ❓ | La API no lo devuelve | Lo calculo en el front: `total_amount / suma del grupo`. La suma es el total de ingresos del grupo porque hay 5 categorías o menos (B2B en octubre: 39038.91 tanto en `/categories/top` como en `/summary`). Va en una función pura con test (R4). |
| Las categorías de cada grupo salen de `/facets` | ❌ | `/facets?business_type=B2B` devuelve lo mismo que sin filtro, e incluye categorías de gasto (`suppliers`, `operational`, `administrative`) | Las categorías de cada grupo salen de `/categories/top`. `/facets` solo aporta el rango de fechas. |
| Un gráfico con el total de ingresos de B2B frente a B2C | ✅ | Se obtiene sumando cada tabla | No hace falta otro endpoint. |
| Filtro de fechas en formato YYYY-MM-DD | ✅ | `/categories/top` acepta `start_date` y `end_date` | Mismas reglas que la Funcionalidad 1. |
| "Una nueva página" | ❓ | El frontend no tiene router: `package.json` no incluye `react-router` | Pregunta abierta: ¿router nuevo o pestaña dentro del dashboard? |

## Preguntas abiertas para el PM

- [ ] ¿Acepta "promedio de periodos anteriores" en lugar de "media móvil de 3", o pide un cambio de backend?
- [ ] ¿Está bien que el top 5 de ingresos muestre solo 2 categorías, ya que son las únicas que existen?
- [ ] ¿La comparativa B2B vs B2C es una página con su propia URL o una pestaña del dashboard?
