# Exploración de la API — base para las specs

**Fecha:** 2026-11-12 · **Rama:** `feature/frontend-specs`

Este archivo es la Fase 1: explorar antes de especificar. Las specs de tipos, componentes y contrato de datos de las fases siguientes deben respetar lo que está aquí.

## Cómo lo verifiqué

1. Arranqué el backend local (`uvicorn --reload`) y leí `/docs`, usando su fuente `GET /openapi.json`.
2. Leí `backend/app/routes.py` para entender cómo se calcula cada campo.
3. Leí el frontend: `App.tsx`, `src/lib/` y `src/components/`, junto con las reglas de `.agents/rules/frontend.md` y `.agents/rules/domain-contract.md`.
4. Pasé el texto de cada funcionalidad del PM por la API y lo probé con llamadas reales (`curl`), incluidos los casos borde.

Leyenda, la misma de la consigna:

- ✅ verificado en `/docs` y con una llamada real
- ❌ incorrecto: la API hace otra cosa
- ❓ sin verificar en `/docs`: la API no lo cubre o depende de una decisión

Cada desajuste se resuelve en la spec, no cambiando el backend ni implementando código.

## Datos de referencia (verificados en `/docs`)

- Todos los endpoints son `GET` y devuelven JSON.
- En los 4 schemas que usan estas funcionalidades todos los campos son obligatorios y ninguno es nulo: `MetricsFacets`, `MetricsAlert`, `TopCategoryItem` y `FinancialMovement`.
- Los datos son 360 movimientos simulados (semilla fija 42), del 2025-11-01 al 2026-10-28, solo en los días 1 a 28 de cada mes.
- Valores permitidos:
  - `operation_type`: `income` | `outcome`
  - `category`: `suppliers` | `sales` | `operational` | `administrative` | `others`
  - `business_type`: `B2B` | `B2C`, en mayúsculas.
- Las fechas van como `AAAA-MM-DD`. Los límites `start_date` y `end_date` son **inclusivos**: con `start_date=end_date=2026-10-02` llega el movimiento de ese día.
- Un valor inválido devuelve `422` con un arreglo `detail[]` que indica el campo que falló (`loc`) y el motivo (`msg`).

## Lo que el frontend ya tiene y las specs deben respetar

| Qué hay hoy | Dónde | Consecuencia para las specs |
| --- | --- | --- |
| Un solo `fetch`, a `/api/metrics`, sin parámetros. La base es `VITE_API_BASE_URL ?? ""` y la ruta es relativa | `App.tsx:17-25` | Al usar un segundo endpoint, los `fetch` pasan a `src/lib/api.ts` (R5). Ningún `fetch` envía parámetros todavía: hay que definir cómo se arman. |
| Orden de la página: header → error → KPIs → gráficos | `App.tsx:50-75` | F1 va arriba, junto al header. F2 va debajo de la sección de gráficos. |
| El header muestra una etiqueta de periodo calculada desde los datos | `dashboard-header.tsx`, `formatPeriodLabel` | Con un filtro activo, la etiqueta refleja los meses filtrados. |
| KPIs y datos mensuales se calculan en el navegador | `lib/financial-utils.ts` | F1 no necesita endpoints nuevos para KPIs ni gráficos: se recalculan con los movimientos filtrados. |
| Las fechas se leen como texto (`isoDate.slice(0, 7)`), nunca con `new Date()` | `financial-utils.ts:6-11` | Las fechas de los inputs se envían y comparan como texto `AAAA-MM-DD`. `new Date("2026-10-01")` se interpreta en UTC y en Chile cae el día anterior (bug ya corregido en `51b9def`). |
| Formatos `formatCurrency` (USD, sin decimales) y `formatPercent` (recibe un porcentaje, 1 decimal) | `financial-utils.ts` | Las tablas nuevas los reutilizan. `formatPercent` espera `59.17`, no `0.5917`. |
| `components/ui/` solo tiene `card` y `skeleton` | `src/components/ui/` | No hay `Table`, `Input` ni `Tabs`. Si se generan con shadcn, primero `cssVariables: true` (R8). |
| Los componentes reciben datos y `loading` por props; los cálculos van en `src/lib/` con test | R4 | El porcentaje de F3 y la conversión de `increase_ratio` son funciones puras con test. |
| Todo texto visible va en **inglés** | R13 | Etiquetas, estados vacíos y errores de las specs se escriben en inglés. |
| Vocabulario `income`, `outcome`, `net`, `profit`; no `expense` ni `revenue` | R12 | La columna de F2 se llama "Outcome", no "Expense". |
| Tipos copiados a mano desde el backend, en `snake_case` | `financial-types.ts`, R11 | Faltan `MetricsFacets`, `MetricsAlert` y `TopCategoryItem`, con los mismos nombres de campo. |

## Funcionalidad 1 — Filtro de rango de fechas

Endpoints: `GET /api/metrics/facets` y `GET /api/metrics?start_date=&end_date=`.

`/facets` responde: `{operation_types[], business_types[], categories[], min_date, max_date}` y no acepta parámetros.

| Lo que dice el PM | Estado | Lo que hace la API | Decisión para la spec |
| --- | --- | --- | --- |
| Fechas en formato YYYY-MM-DD | ✅ | `start_date` y `end_date` son de tipo `date`. `01-10-2026` → `422` | Se envía el valor del input de fecha tal cual (`AAAA-MM-DD`), sin pasar por `Date`. |
| Ambos opcionales; si están vacíos, se muestra todo | ✅ con matiz | Sin parámetros llegan los 360 movimientos. Con un solo límite también funciona: solo `start_date=2026-10-01` → 30 movimientos. Pero `start_date=` vacío → `422` | Si un input está vacío, **no se envía** su parámetro. |
| "Extensión de filtros sobre el endpoint de métricas existente" | ❌ | `/api/metrics` ya acepta `start_date` y `end_date` | No hay nada que extender en el backend: el fetch existente solo agrega los parámetros. |
| Filtrar todos los datos de la página | ✅ | Los KPIs, los gráficos y la etiqueta del header salen de un solo fetch (`App.tsx:20`) | Al cambiar una fecha se vuelve a pedir y se recalcula todo. Si el rango corta un mes por la mitad, ese mes aparece parcial en los gráficos. |
| Mostrar el rango disponible | ✅ | `/facets` → `min_date` 2025-11-01, `max_date` 2026-10-28 | Se muestra "Available data: 2025-11-01 – 2026-10-28" y esas fechas son el `min` y `max` de los inputs. |
| Límites incluidos (no lo dice) | ✅ | `start_date` y `end_date` son inclusivos | La spec dice "desde y hasta, ambos incluidos". |
| Inicio posterior al fin (no lo dice) | ❓ | La API no lo valida: devuelve `[]` con `200` | La UI muestra "Start date must be before end date." y no hace la llamada. |
| Rango sin datos (no lo dice) | ❓ | `start_date=2030-01-01` → `[]` con `200` | Estado vacío: "No movements in this date range." |

## Funcionalidad 2 — Tabla de alertas de anomalías

Endpoint: `GET /api/metrics/alerts?threshold=&group_by=month&start_date=&end_date=`.

Responde: `[{period, outcome_total, baseline_average, increase_ratio}]`.

| Lo que dice el PM | Estado | Lo que hace la API | Decisión para la spec |
| --- | --- | --- | --- |
| Columna "período" | ✅ | `period` en formato `AAAA-MM` (por defecto `group_by=month`) | Se envía `group_by=month` de forma explícita. Etiqueta: "Period". |
| Columna "outcome registrado" | ✅ | `outcome_total` | Etiqueta "Outcome", con `formatCurrency`. |
| Columna "media móvil de los 3 períodos anteriores" | ❌ | `baseline_average` es el promedio de **todos** los periodos anteriores dentro del rango. En 2026-03 vale 55334.29 (promedio de 4 meses); la media de 3 sería 59977.58 | Etiqueta "Average of previous periods". Si el PM exige la media de 3, hay que cambiar el backend (pregunta abierta). |
| Columna "incremento porcentual" | ✅ con conversión | `increase_ratio` es una proporción (`0.5917`) | Etiqueta "Increase", con `formatPercent(increase_ratio × 100)` → "59.2%". |
| Umbral entre 0.01 y 1.0, por defecto 0.3 | ❌ parcial | El valor por defecto 0.3 es correcto. Pero la API acepta cualquier valor ≥ 0, sin máximo: `0` incluye 2026-07 (0,39 %), `1.5` → `[]`, `-0.1` y `abc` → `422`. En los bordes: `0.01` → 5 alertas, `1.0` → 1 (2025-12) | Input numérico con `min=0.01`, `max=1` y `step=0.01`. La UI valida y no envía valores fuera de rango ni vacíos. |
| Gasto que "subió de forma inesperada" | ✅ | Solo hay alerta si `increase_ratio` es **mayor** que el umbral; si es igual, no cuenta | La spec dice "mayor que el umbral". |
| Mensaje explícito si no hay anomalías | ✅ | Sin alertas → `[]` con `200` | La tabla muestra "No outcome increases above {threshold × 100}% for this period." |
| Respeta el rango de fechas de la Funcionalidad 1 | ✅ con efecto | Acepta `start_date` y `end_date`, pero el promedio cambia con el rango. Con `start_date=2026-03-01`, el promedio de 2026-06 pasa de 57416.5 a 60192.76. El primer mes del rango nunca genera alerta | Se reenvían las mismas fechas de F1, con las mismas reglas. La spec advierte que cambiar el rango cambia las alertas. |

## Funcionalidad 3 — Comparativa B2B vs B2C

Endpoints: `GET /api/metrics/categories/top?operation_type=income&limit=5&business_type=` (una llamada por línea de negocio) y `GET /api/metrics/facets`.

`/categories/top` responde: `[{category, operation_type, total_amount}]`, ordenado de mayor a menor.

| Lo que dice el PM | Estado | Lo que hace la API | Decisión para la spec |
| --- | --- | --- | --- |
| Endpoint `categories/top?operation_type=income&limit=5` | ❌ incompleto | Sin `business_type` devuelve B2B y B2C **sumados** (`sales` 1132097.38) | Se agrega `business_type=B2B` o `business_type=B2C`: dos llamadas, una por sección. `b2b` en minúsculas → `422`. |
| Top 5 de categorías de ingreso por línea | ❌ en los datos | Solo existen 2 categorías de ingreso (`sales` y `others`): cada línea devuelve 2 filas. B2B en octubre de 2026 devuelve 1 | La tabla muestra de 0 a 5 filas, sin huecos. Con 0 filas: "No income for this business line in this date range." |
| Porcentaje sobre el total del grupo | ❓ | La API no lo devuelve | Se calcula en el front: `total_amount / suma del grupo × 100`. La suma es el total de ingresos del grupo porque hay 5 categorías o menos (B2B en octubre: 39038.91 tanto en `/categories/top` como en `/summary`). Función pura con test (R4). |
| Las categorías de cada grupo salen de `/facets` | ❌ | `/facets?business_type=B2B` devuelve lo mismo que sin filtro, e incluye categorías de `outcome` (`suppliers`, `operational`, `administrative`) | Las categorías de cada grupo salen de `/categories/top`. `/facets` solo aporta el rango de fechas. |
| Un gráfico con el total de ingresos de B2B frente a B2C | ✅ | Se obtiene sumando cada tabla | No hace falta otro endpoint. |
| Filtro de fechas en formato YYYY-MM-DD | ✅ | `/categories/top` acepta `start_date` y `end_date`, inclusivos | Mismas reglas que la Funcionalidad 1. |
| "Una nueva página" | ❓ | El frontend no tiene router: `package.json` no incluye `react-router` | Pregunta abierta: ¿router nuevo o vista alternativa dentro de `App.tsx`? |

## Preguntas abiertas para el PM

- [ ] ¿Acepta "promedio de periodos anteriores" en lugar de "media móvil de 3", o pide un cambio de backend?
- [ ] ¿Está bien que el top 5 de ingresos muestre solo 2 categorías, ya que son las únicas que existen?
- [ ] ¿La comparativa B2B vs B2C es una página con su propia URL o una vista dentro del dashboard?
- [ ] ¿El filtro de fechas de la comparativa es independiente del filtro del dashboard principal, o es el mismo?
