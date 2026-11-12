# Contrato de datos del frontend

**Fecha:** 2026-11-12 · **Rama:** `feature/frontend-specs` · **Backend verificado:** `http://127.0.0.1:8000/docs`

Este README es el punto de entrada para implementar las tres funcionalidades nuevas del dashboard:

- **F1:** filtro de rango de fechas.
- **F2:** tabla de alertas de anomalías.
- **F3:** vista comparativa B2B vs B2C.

Dice qué endpoint llama cada funcionalidad, con qué parámetros, qué responde y qué muestra la UI en los casos borde. Si eres una sesión nueva, con este archivo y los tipos que enlaza puedes implementar sin leer la conversación que los produjo.

## Archivos de esta carpeta

Léelos en este orden:

| Archivo | Qué tiene |
| --- | --- |
| `README.md` | Este contrato: endpoints, parámetros, respuestas y casos borde. |
| `api-contract.ts` | Mapa endpoint → tipo de request y tipo de response, y el tipo del error 422. |
| `api-types.ts` | Tipos de las respuestas (`FacetsResponse`, `AlertsResponse`, …), con JSDoc. |
| `param-types.ts` | Tipos de los parámetros (`DateRangeFilter`, `AlertsParams`, `TopCategoriesParams`), con JSDoc. |
| `components.md` | Componentes, props, renderizado condicional y las 7 decisiones sobre ambigüedades del PM. |
| `component-props.ts` | Props de los componentes como TypeScript. |
| `00-api-exploration.md` | Evidencia: qué dijo el PM, qué hace la API y cómo lo verifiqué. |
| `tsconfig.json` | Permite compilar estos `.ts` con las reglas de la app. |

## Antes de implementar

- **No cambies el backend.** Todo lo de este contrato funciona con la API actual.
- **Los `fetch` van en `src/lib/api.ts` (R5).** Los componentes no piden datos ni calculan (R4): `App.tsx` llama, guarda el estado y pasa props.
- **Base URL:** `import.meta.env.VITE_API_BASE_URL ?? ""`, como hoy en `App.tsx`. Las rutas son relativas (`/api/metrics/...`).
- **Campos de la API en `snake_case`** (R11). Textos de UI en inglés (R13), con vocabulario `income`/`outcome` (R12).
- **Fechas siempre como texto `YYYY-MM-DD`.** Nunca pases una fecha por `new Date()`: se interpreta en UTC y al oeste de UTC cae el día anterior.

### Qué existe hoy y qué se crea

`src/` no puede importar de `specs/`: los tipos se copian.

| Qué | Dónde va | ¿Existe? |
| --- | --- | --- |
| Tipos de `api-types.ts`, `param-types.ts` y `api-contract.ts` | `src/lib/financial-types.ts`, junto a `FinancialMovement` | No: copiarlos |
| `fetch` de los 4 endpoints (y mover el de `App.tsx`) | `src/lib/api.ts` | No: crear el archivo |
| Props de cada componente (`component-props.ts`) | Una `interface` local en cada `.tsx`, como `KPIRowProps` | No |
| Funciones puras de la tabla siguiente | `src/lib/financial-utils.ts`, con tests en `financial-utils.test.ts` | No, salvo `formatMonthYearLabel` |

Funciones puras que hay que crear. Las usan las secciones F1, F2 y F3 de este README.

| Función | Firma | Regla |
| --- | --- | --- |
| `validateDateRange` | `(range: DateRangeFilter) => string \| null` | Si hay dos fechas y `start_date > end_date` (comparando texto), devuelve `"Start date must be on or before end date."`. Si no, `null`. |
| `parseThreshold` | `(text: string) => number \| null` | Devuelve el número si es finito y está entre 0.01 y 1, ambos incluidos. Si no, `null`. |
| `toCategoryShareRows` | `(entries: TopCategoriesResponse) => { rows: CategoryShareRow[]; totalIncome: number }` | `totalIncome` = suma de `total_amount`, y `sharePercent` = `total_amount / totalIncome × 100`. Con `[]` devuelve `{ rows: [], totalIncome: 0 }`, sin dividir por 0. |
| `parseDashboardView` | `(hash: string) => DashboardView` | `"#/business-comparison"` → `"business-comparison"`. Cualquier otro valor → `"overview"`. |
| `formatMonthYearLabel` | `(yearMonth: string) => string` | **Ya existe** en `financial-utils.ts`, pero es privada: solo hay que agregarle `export`. `"2026-03"` → `"Mar 2026"`. |

`CategoryShareRow` y `DashboardView` están en `component-props.ts`.

## Cómo verificar este contrato

```bash
# 1. Backend (desde backend/)
.venv/Scripts/python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
# 2. Abrir http://127.0.0.1:8000/docs (fuente: /openapi.json)
# 3. Tipos de las specs (desde frontend/)
npx tsc --noEmit -p specs
```

`npx tsc --noEmit` sin `-p specs` no revisa estos archivos: el `tsconfig.json` raíz tiene `"files": []`, y la app solo incluye `src/`.

Leyenda de este documento:

- ✅ verificado en `/docs` y con una llamada real el 2026-11-12
- ❌ el brief del PM dice otra cosa que la API
- 📐 decisión de spec, ya cerrada: no depende de la API, se implementa tal cual

## Reglas comunes a todas las peticiones

| Regla | Detalle | Estado |
| --- | --- | --- |
| Método y formato | Todo es `GET` y responde JSON con HTTP 200. | ✅ |
| Parámetros vacíos | Un parámetro sin valor **se omite** de la URL. `?start_date=` → 422 `"Input should be a valid date or datetime, input is too short"`. | ✅ |
| Parámetro inválido | HTTP 422 con cuerpo `HttpValidationError` (`{ detail: [{ loc, msg, type, input?, ctx? }] }`). La UI no muestra `detail`: muestra el mensaje de error del bloque afectado. | ✅ |
| Fechas | `YYYY-MM-DD`, ambos extremos **incluidos**. `01-10-2026` → 422. | ✅ |
| Enums | En mayúsculas o minúsculas exactas: `B2B`/`B2C`, `income`/`outcome`, `month`. `b2b` → 422. | ✅ |
| Error de red o HTTP ≠ 200 | `src/lib/api.ts` lanza un error. `App` muestra el mensaje de error del bloque (textos exactos en los casos borde de F1, F2 y F3) y deja de mostrar el skeleton. | 📐 |
| Respuestas fuera de orden | Si el usuario cambia el filtro rápido, solo se aplica la respuesta de la **última** petición de cada endpoint (por ejemplo, abortando la anterior con `AbortController`). | 📐 |

Cómo armar la query: con `URLSearchParams`, agregando solo los campos que no son `undefined`. Los números se envían con `String(n)` (`0.3` → `"0.3"`) y las fechas tal cual.

## Endpoints

| Endpoint | Lo usa | Tipo de request | Tipo de response | En `/docs` |
| --- | --- | --- | --- | --- |
| `GET /api/metrics/facets` | F1, F3 | `NoParams` | `FacetsResponse` (`MetricsFacets`) | ✅ |
| `GET /api/metrics` | F1 | `DateRangeFilter` | `MetricsResponse` (`FinancialMovement[]`) | ✅ |
| `GET /api/metrics/alerts` | F2 | `AlertsParams` | `AlertsResponse` (`MetricsAlert[]`) | ✅ |
| `GET /api/metrics/categories/top` | F3 | `TopCategoriesParams` | `TopCategoriesResponse` (`TopCategoryItem[]`) | ✅ |

El mapa completo está en `api-contract.ts`:

```ts
export interface ApiContract {
  "/api/metrics/facets": { params: NoParams; response: FacetsResponse };
  "/api/metrics": { params: DateRangeFilter; response: MetricsResponse };
  "/api/metrics/alerts": { params: AlertsParams; response: AlertsResponse };
  "/api/metrics/categories/top": {
    params: TopCategoriesParams;
    response: TopCategoriesResponse;
  };
}
```

### Cuándo se llama a cada endpoint

El rango de fechas es **un solo estado**, `dateRange: DateRangeFilter`, guardado en `App.tsx` y compartido por las dos vistas. Cada vista muestra su propio `DateRangePicker`, pero los dos reciben el mismo `value` y el mismo `onChange`. Al pasar de `"overview"` a `"business-comparison"` (o al revés) el rango se mantiene. Los demás estados de `App` están en `components.md`, sección "Estado que guarda `App`".

| Momento | Llamadas |
| --- | --- |
| Al cargar la app | `/facets` una sola vez: no depende de ningún filtro. |
| Vista `"overview"` visible (al entrar o al cambiar el rango válido) | `/api/metrics` y `/api/metrics/alerts`. |
| Cambia el umbral válido (F2) | Solo `/api/metrics/alerts`. |
| Vista `"business-comparison"` visible (al entrar o al cambiar el rango válido) | `/api/metrics/categories/top` dos veces, B2B y B2C, en paralelo. |
| Rango inválido (`start_date > end_date`) o umbral inválido | Ninguna. Se conservan los últimos datos válidos. |

## Tipos compartidos

De `api-types.ts` y `param-types.ts`, sin JSDoc. Los enums vienen de `src/lib/financial-types.ts`, que `backend/tests/test_contract.py` mantiene sincronizado con el backend (R1).

```ts
type OperationType = "income" | "outcome";
type Category = "suppliers" | "sales" | "operational" | "administrative" | "others";
type BusinessType = "B2B" | "B2C";

export type IsoDateString = string;

export interface DateRangeFilter {
  start_date?: IsoDateString;
  end_date?: IsoDateString;
}
```

`DateRangeFilter` es la base de los parámetros de las tres funcionalidades. `AlertsParams` y `TopCategoriesParams` la extienden.

## Funcionalidad 1 — Filtro de rango de fechas

### Requests

**`GET /api/metrics/facets`** — sin parámetros. ✅

**`GET /api/metrics`** — tipo `DateRangeFilter`. ✅

| Parámetro | Tipo TS | Obligatorio | Valores válidos | Qué envía F1 |
| --- | --- | --- | --- | --- |
| `start_date` | `IsoDateString` | No | Fecha `YYYY-MM-DD`, incluida. Rango útil: `min_date` a `max_date` de `/facets`. | El valor del input "Start date". Se omite si está vacío. |
| `end_date` | `IsoDateString` | No | Fecha `YYYY-MM-DD`, incluida. Debe ser ≥ `start_date`, pero la API no lo valida. | El valor del input "End date". Se omite si está vacío. |

`/api/metrics` también acepta `category` y `operation_type`. F1 no los usa, así que no están en el tipo.

Restricción de la UI: si hay dos fechas y `start_date > end_date` (comparando el texto), no se hace la llamada.

### Responses

```ts
export interface FacetsResponse {
  operation_types: OperationType[];
  business_types: BusinessType[];
  categories: Category[];
  min_date: IsoDateString;
  max_date: IsoDateString;
}

export type MetricsResponse = FinancialMovement[];
// FinancialMovement = { create_date, amount, operation_type, category, business_type }
```

Valores verificados de `/facets`: `min_date` = `"2025-11-01"`, `max_date` = `"2026-10-28"`. Los movimientos llegan ordenados por `create_date`.

### Uso en la UI

- `min_date` y `max_date` son el `min` y `max` de los inputs, y el texto `"Available data: 2025-11-01 – 2026-10-28"`.
- Con los movimientos filtrados, `computeKPIs` y `computeMonthlyData` recalculan los KPIs y los gráficos, como hoy.

### Casos borde

| # | Caso | Request | Respuesta real | Qué muestra la UI |
| --- | --- | --- | --- | --- |
| 1 | Inicio posterior al fin | ninguna (sería `?start_date=2026-10-31&end_date=2026-10-01`) | La API devolvería `[]` con 200: no lo valida | `"Start date must be on or before end date."` con `role="alert"`. Se siguen viendo los datos anteriores. |
| 2 | Rango sin movimientos | `?start_date=2030-01-01` | `[]` con 200 ✅ | `"No movements in this date range."`, KPIs en `"—"`, gráficos con `"No data available to display"` y sin etiqueta de periodo. |
| 3 | Solo fecha de inicio | `?start_date=2026-10-01` | 30 movimientos ✅ | Datos desde esa fecha hasta el final del dataset. |
| 4 | Solo fecha de fin | `?end_date=2025-11-30` | 30 movimientos ✅ | Datos desde el inicio del dataset hasta esa fecha. |
| 5 | Mismo día en inicio y fin | `?start_date=2026-10-02&end_date=2026-10-02` | 1 movimiento ✅ | El rango incluye ese día. |
| 6 | Input vacío | se omite el parámetro (`?start_date=` daría 422) ✅ | Sin filtro de ese lado | Igual que no tener esa fecha. "Clear" deja `{}`: 360 movimientos. |
| 7 | `/facets` falla | `/facets` | Error de red o HTTP ≠ 200 | Inputs sin `min`/`max` y `"Available data range unavailable."`. El filtro sigue funcionando. |
| 8 | `/api/metrics` falla | `/api/metrics?...` | Error de red o HTTP ≠ 200 | El aviso que ya existe: `"Could not load financial data. Check that the backend API is running."` |

## Funcionalidad 2 — Tabla de alertas de anomalías

### Request

**`GET /api/metrics/alerts`** — tipo `AlertsParams`. ✅

```ts
export type GroupBy = "day" | "week" | "month";

export interface AlertsParams extends DateRangeFilter {
  threshold?: number;
  group_by?: GroupBy;
}
```

| Parámetro | Tipo TS | En la API (`/docs`) | En la UI | Qué envía F2 |
| --- | --- | --- | --- | --- |
| `threshold` | `number` | Opcional. Número ≥ 0, sin máximo, por defecto `0.3`. Es una **proporción**: `0.3` = 30 %. | De `0.01` a `1`, ambos incluidos, en pasos de `0.01`. Valor inicial `0.3`. | Siempre el último umbral válido. |
| `group_by` | `GroupBy` | Opcional. `day`, `week` o `month`; por defecto `month`. | Fijo, no se muestra. | Siempre `"month"`, para que `period` sea `YYYY-MM`. |
| `start_date`, `end_date` | `IsoDateString` | Iguales que en F1. | Los de F1. | El mismo rango válido de F1, omitiendo las fechas vacías. |

La API también acepta `business_type`. F2 no lo usa, así que no está en el tipo.

Regla del backend: hay alerta solo si `increase_ratio` es **mayor** que `threshold`; si es igual, no cuenta. ✅

### Response

```ts
export interface AlertEntry {
  period: string;
  outcome_total: number;
  baseline_average: number;
  increase_ratio: number;
}

export type AlertsResponse = AlertEntry[];
```

| Campo | Significado | Columna y formato |
| --- | --- | --- |
| `period` | Mes `YYYY-MM` | "Period", `formatMonthYearLabel` → `"Mar 2026"` |
| `outcome_total` | Suma de `outcome` del mes | "Outcome", `formatCurrency` → `"$88,077"` |
| `baseline_average` | Promedio de **todos** los meses anteriores del rango ❌ no es la media móvil de 3 que pidió el PM | "Average of previous periods", `formatCurrency` → `"$55,334"` |
| `increase_ratio` | Proporción de subida (`0.5917`) | "Increase", `formatPercent(increase_ratio * 100)` → `"59.2%"` |

Ejemplo verificado con `?threshold=0.3&group_by=month`: 4 alertas (2025-12, 2026-03, 2026-06 y 2026-08). La de 2026-03 es `{ outcome_total: 88076.9, baseline_average: 55334.29, increase_ratio: 0.5917 }`. ✅

### Casos borde

| # | Caso | Request | Respuesta real | Qué muestra la UI |
| --- | --- | --- | --- | --- |
| 1 | Ninguna anomalía | `?threshold=0.3&group_by=month&start_date=2026-10-01&end_date=2026-10-28` | `[]` con 200 ✅ | **Estado vacío explícito**: la tarjeta y el umbral siguen visibles, con `"No outcome increases above 30.0% in this date range."` |
| 2 | Umbral inválido: vacío, `"abc"`, `0` o `1.5` | ninguna | La API daría 422 con `abc` o `-0.1`, y `[]` con `1.5` ✅ | `"Enter a value between 0.01 and 1."` con `role="alert"`. La tabla conserva los últimos resultados válidos. |
| 3 | Umbral en los bordes | `?threshold=0.01` / `?threshold=1` | 5 alertas / 1 alerta (2025-12, `increase_ratio` 1.4968) ✅ | La tabla con esas filas. Los dos valores son válidos en la UI. |
| 4 | El rango cambia el promedio | `?threshold=0.3&group_by=month&start_date=2026-03-01` | 1 alerta (2026-06), contra 4 sin rango ✅ | La tabla con lo que llegue, y siempre la nota `"The first month in the selected range is never flagged, because it has no previous periods to compare with."` |
| 5 | Rango sin datos | `?threshold=0.3&group_by=month&start_date=2030-01-01` | `[]` con 200 ✅ | El mismo estado vacío del caso 1. |
| 6 | La petición falla | `/api/metrics/alerts?...` | Error de red o HTTP ≠ 200 | `"Could not load alerts. Check that the backend API is running."`. El umbral sigue visible. |

## Funcionalidad 3 — Vista comparativa B2B vs B2C

### Requests

`/api/metrics/facets`, el mismo de F1, solo para el rango de fechas. ✅ No sirve para las categorías: ignora `business_type` y mezcla categorías de `outcome`.

**`GET /api/metrics/categories/top`** — tipo `TopCategoriesParams`, **dos llamadas**: una por línea de negocio. ✅

```ts
export interface TopCategoriesParams extends DateRangeFilter {
  operation_type?: OperationType;
  limit?: number;
  business_type?: BusinessType;
}
```

| Parámetro | Tipo TS | En la API (`/docs`) | Qué envía F3 |
| --- | --- | --- | --- |
| `operation_type` | `OperationType` | Opcional. `income` o `outcome`; por defecto **`outcome`**. | Siempre `"income"`. |
| `limit` | `number` | Opcional. Entero de 1 a 20; por defecto `5`. `0` o `21` → 422. Es un máximo. | Siempre `5`. |
| `business_type` | `BusinessType` | Opcional. `B2B` o `B2C`, en mayúsculas. Sin él, la API **suma** las dos líneas. | Siempre: `"B2B"` en una llamada y `"B2C"` en la otra. |
| `start_date`, `end_date` | `IsoDateString` | Iguales que en F1. | El mismo rango válido de F1 (decisión 4 de `components.md`). |

Ejemplo de las dos llamadas sin fechas:

```
GET /api/metrics/categories/top?operation_type=income&limit=5&business_type=B2B
GET /api/metrics/categories/top?operation_type=income&limit=5&business_type=B2C
```

El brief del PM omitía `business_type` ❌. Sin él llega `sales` = 1132097.38: B2B y B2C sumados.

### Response

```ts
export interface CategoryEntry {
  category: Category;
  operation_type: OperationType;
  total_amount: number;
}

export type TopCategoriesResponse = CategoryEntry[];
```

Llega ordenada por `total_amount`, de mayor a menor. Con `income` solo existen 2 categorías (`sales` y `others`), así que llegan **como máximo 2** aunque `limit` sea 5. ✅

Respuestas reales sin fechas:

- B2B: `sales` 557903.97 y `others` 57636.75.
- B2C: `sales` 574193.41 y `others` 68412.74.

La API no da el porcentaje sobre el total. Lo calcula `toCategoryShareRows`, una función nueva (firma en "Qué existe hoy y qué se crea"): `totalIncome` = suma de `total_amount`, y `sharePercent` = `total_amount / totalIncome × 100`. Para B2B: total `$615,541` y `sales` `90.6%`. El gráfico usa los dos `totalIncome`.

### Casos borde

| # | Caso | Request | Respuesta real | Qué muestra la UI |
| --- | --- | --- | --- | --- |
| 1 | Menos de 5 categorías (el caso normal) | `business_type=B2B`, sin fechas | 2 filas ✅ | La tabla con 2 filas, sin relleno, y `"Only 2 income categories have data for B2B."` |
| 2 | Una línea con una sola categoría | `business_type=B2B&start_date=2026-10-01&end_date=2026-10-28` | 1 fila: `sales` 39038.91 ✅ | La tabla con 1 fila (100.0%) y `"Only 1 income category has data for B2B."` (en singular). |
| 3 | Top 5 vacío en un panel | `business_type=B2B&start_date=2030-01-01` | `[]` con 200 ✅ | Ese panel conserva su título y muestra `"No income for B2B in this date range."`, sin tabla ni pie. `toCategoryShareRows([])` da `{ rows: [], totalIncome: 0 }`, sin dividir por 0. |
| 4 | Los dos paneles vacíos | Las dos llamadas con `start_date=2030-01-01` | `[]` y `[]` ✅ | Los dos paneles con su estado vacío, y el gráfico con `"No income data for this date range."` |
| 5 | Falla una de las dos llamadas | Una de las dos | Error de red o HTTP ≠ 200 | Solo ese panel muestra `"Could not load B2B income categories."` (o B2C). El otro panel funciona. El gráfico muestra `"Comparison unavailable: could not load both business lines."` |
| 6 | `business_type` mal escrito | `business_type=b2b` | 422 `"Input should be 'B2B' or 'B2C'"` ✅ | No debe pasar: el valor sale del tipo `BusinessType`, no de texto libre. Si pasara, se ve como el caso 5. |

## Estado de verificación

| Afirmación | Estado |
| --- | --- |
| Los 4 endpoints existen en `/docs` con los parámetros y schemas de esta tabla | ✅ |
| Todos los campos de las respuestas son obligatorios y ninguno es nulo | ✅ |
| Los tipos TS coinciden con `/openapi.json`, sin `any` | ✅ (`npx tsc --noEmit -p specs` compila) |
| Fechas inclusivas; parámetro vacío → 422; inicio > fin → `[]` | ✅ |
| `threshold` ≥ 0 sin máximo; la alerta exige "mayor que" | ✅ |
| `limit` de 1 a 20; `business_type` en mayúsculas; sin él se suman las líneas | ✅ |
| `baseline_average` es la media móvil de 3 meses | ❌ es el promedio de todos los meses anteriores del rango |
| `/facets` sirve para listar las categorías de cada línea | ❌ ignora `business_type` |
| Comportamiento ante errores de red y respuestas fuera de orden | 📐 no se puede ver en `/docs`; está definido en "Reglas comunes" |

## Pendiente con el PM

Estas preguntas no bloquean la implementación: la spec ya tiene una decisión para cada una (ver `components.md`).

- [ ] ¿Acepta "Average of previous periods" en lugar de la media móvil de 3, o pide un cambio de backend?
- [ ] ¿Está bien un "top 5" que muestra 2 categorías, porque son las únicas de ingreso que existen?
