# Especificación de componentes

**Fecha:** 2026-11-12 · **Rama:** `feature/frontend-specs`

Qué componentes se construyen para cada funcionalidad, qué props reciben y qué muestran en cada estado.

Archivos relacionados:

- Props como TypeScript: `component-props.ts`, compilado con `tsc --strict`.
- Tipos de la API: `api-types.ts` y `param-types.ts`.
- Evidencia de cada dato: `00-api-exploration.md`.

## Reglas que aplican a todos los componentes

- **Los componentes no piden datos ni calculan (R4).** `App.tsx` es el único contenedor: guarda el estado, llama a la API (por `src/lib/api.ts`, R5) y pasa los datos listos por props. Los cálculos van en funciones puras de `src/lib/` con test.
- **Textos de UI en inglés (R13)** y vocabulario `income` / `outcome` (R12). Todos los textos de este documento entre comillas son los literales de la UI.
- **Patrón visual existente:** cada bloque es un `Card` de `components/ui/card`. Mientras carga, muestra `Skeleton` con la misma forma. Si no hay datos, muestra un mensaje centrado en `text-muted-foreground`, como `IncomeOutcomeChart`.
- **Colores solo con tokens (R7):** `var(--chart-1)`, `var(--destructive)`, etc.
- **Faltan componentes base:** `components/ui/` solo tiene `card` y `skeleton`. La tabla y los inputs se escriben con HTML semántico (`<table>`, `<input type="date">`, `<input type="number">`). Si se generan con shadcn, antes hay que poner `cssVariables: true` (R8).
- **Archivos en `components/dashboard/`**, en `kebab-case.tsx`, con named export (R10).
- **Fechas siempre como texto `YYYY-MM-DD`.** Nunca se convierten con `new Date()` (bug de zona horaria ya corregido en `51b9def`).

## Ambigüedades del brief y cómo las resuelvo

| # | Qué dejó abierto el PM | Decisión | Por qué |
| --- | --- | --- | --- |
| 1 | Pide una "media móvil de los 3 períodos anteriores" | Se muestra `baseline_average` con la etiqueta "Average of previous periods" | La API calcula el promedio de **todos** los periodos anteriores. Cambiar el backend está fuera de alcance, y una etiqueta falsa engañaría al usuario. |
| 2 | Pide un "top 5" de ingresos, pero solo existen 2 categorías de ingreso | La tabla muestra las filas que lleguen (0 a 5), sin rellenar, y avisa cuando son menos de 5 | Inventar filas vacías falsearía el dato. |
| 3 | "Nueva página", sin router en el proyecto | Dos vistas elegidas por el hash de la URL: `#/` y `#/business-comparison` | Da una URL propia, que se puede compartir y funciona con el botón "atrás", sin agregar `react-router`. |
| 4 | No dice si la comparativa comparte el filtro de fechas del dashboard | Hay **un solo** rango de fechas para las dos vistas | Al cambiar de vista, el usuario sigue mirando el mismo periodo. |
| 5 | "Las categorías de cada grupo salen de `/facets`" | Las categorías salen de `/categories/top`. `/facets` solo da el rango de fechas | `/facets` ignora `business_type` y mezcla categorías de `outcome`. |
| 6 | No dice cuándo se aplica el filtro | Se aplica al cambiar un input, sin botón "Apply". Un valor inválido no se envía | Los inputs de fecha nativos entregan una fecha completa o `""`, nunca a medias. |
| 7 | No dice qué pasa con un umbral inválido | Se muestra el error, no se llama a la API y la tabla conserva los últimos resultados válidos | Así la tabla no parpadea mientras el usuario escribe. |

## Funcionalidad 1 — Filtro de rango de fechas

### Componentes

| Componente | Archivo | Nuevo o modificado | Props |
| --- | --- | --- | --- |
| `DateRangePicker` | `date-range-picker.tsx` | Nuevo | `DateRangePickerProps` |
| `EmptyStateMessage` | `empty-state-message.tsx` | Nuevo (compartido) | `EmptyStateMessageProps` |
| `KPIRow`, `IncomeOutcomeChart`, `ProfitPercentChart`, `DashboardHeader` | existentes | Sin cambios de props | Reciben los datos ya filtrados |

Ubicación: en la vista `"overview"`, el `DateRangePicker` va entre `DashboardHeader` y la sección de KPIs.

### `DateRangePicker`

Muestra dos `<input type="date">`, un botón y un texto de referencia:

| Elemento | Detalle |
| --- | --- |
| "Start date" | `value` = `value.start_date ?? ""`. `min` = `availableRange.min_date`. `max` = `value.end_date ?? availableRange.max_date`. |
| "End date" | `value` = `value.end_date ?? ""`. `min` = `value.start_date ?? availableRange.min_date`. `max` = `availableRange.max_date`. |
| Botón "Clear" | Llama a `onChange({})`. Está deshabilitado si los dos inputs están vacíos. |
| Texto de referencia | `"Available data: {min_date} – {max_date}"`, por ejemplo `"Available data: 2025-11-01 – 2026-10-28"`. |

Al cambiar un input, llama a `onChange` con el rango nuevo. Si un input queda vacío, su campo se **elimina** del objeto; nunca se envía `""` (la API respondería 422).

Renderizado condicional:

| Condición | Qué muestra |
| --- | --- |
| `availableRange === null` (`/facets` cargando o con error) | Inputs sin `min` ni `max`, y el texto `"Available data range unavailable."` |
| `validationError !== null` | El mensaje debajo de los inputs, con `role="alert"` y color `var(--destructive)`. |
| Siempre | Los dos inputs y el botón. El componente no tiene estado de carga propio. |

### Comportamiento según qué fechas hay

Este comportamiento lo decide `App` y lo valida `validateDateRange` (`src/lib/`).

| Inputs con valor | Parámetros enviados | Resultado |
| --- | --- | --- |
| Ninguno | ninguno | Todo el dataset: 360 movimientos, del 2025-11-01 al 2026-10-28. |
| Solo inicio | `start_date` | Desde esa fecha (incluida) hasta el final del dataset. |
| Solo fin | `end_date` | Desde el inicio del dataset hasta esa fecha (incluida). |
| Ambos, inicio ≤ fin | `start_date` y `end_date` | Ese rango, con los dos extremos incluidos. |
| Ambos, inicio > fin | no se llama a la API | `validationError` = `"Start date must be on or before end date."`; se siguen viendo los datos anteriores. |
| Una fecha fuera del rango disponible (escrita a mano) | se envía igual | Es válida; si no hay movimientos, se muestra el estado vacío. |

### Qué cambia en la vista con el filtro activo

| Movimientos filtrados | KPIs (`KPIRow`) | Gráficos | Etiqueta de periodo del header |
| --- | --- | --- | --- |
| 1 o más | Calculados con `computeKPIs` sobre los filtrados | `computeMonthlyData` sobre los filtrados. Un mes cortado por el rango aparece parcial | `formatPeriodLabel`, por ejemplo `"Oct 2026"` |
| 0 | `metrics = null`, así que cada tarjeta muestra `"—"` | Su estado vacío actual: `"No data available to display"` | Oculta (`formatPeriodLabel([])` devuelve `""`) |

Con 0 movimientos, además, se muestra `EmptyStateMessage` con `"No movements in this date range."` encima de los KPIs.

### `EmptyStateMessage`

Un párrafo centrado, en `text-muted-foreground`, con `message`. Lo usan las tres funcionalidades.

## Funcionalidad 2 — Tabla de alertas de anomalías

### Componentes

| Componente | Archivo | Nuevo o modificado | Props |
| --- | --- | --- | --- |
| `AnomalyAlertsCard` | `anomaly-alerts-card.tsx` | Nuevo | `AnomalyAlertsCardProps` |
| `ThresholdInput` | `threshold-input.tsx` | Nuevo | `ThresholdInputProps` |

Ubicación: vista `"overview"`, debajo de la sección de gráficos, a todo el ancho.

### `ThresholdInput`

- Un `<input type="number">` con la etiqueta "Alert threshold (ratio)", `min="0.01"`, `max="1"` y `step="0.01"`.
- El valor inicial es `"0.3"`.
- Ayuda bajo el input: `"0.3 = alert when outcome is more than 30% above the average of previous periods."`
- Si `error !== null`, muestra `error` con `role="alert"` y color `var(--destructive)`.

`App` convierte el texto con `parseThreshold` (`src/lib/`). Es válido si es un número finito entre `0.01` y `1`, ambos incluidos. Si no (vacío, `"abc"`, `0`, `1.5`), el error es `"Enter a value between 0.01 and 1."` y no se llama a la API.

### `AnomalyAlertsCard`

- Cabecera: título `"Outcome anomalies"`, descripción `"Periods where outcome rose above the average of previous periods"` y el `ThresholdInput`.
- El `ThresholdInput` está **siempre visible**, también mientras carga, si hay error o si la tabla está vacía, para que el usuario pueda cambiar el umbral.

Columnas de la tabla, en el orden de la API (cronológico):

| Columna | Campo | Formato | Ejemplo |
| --- | --- | --- | --- |
| "Period" | `period` (`YYYY-MM`) | `formatMonthYearLabel` (hoy es privada en `financial-utils.ts`: hay que exportarla) | `"Mar 2026"` |
| "Outcome" | `outcome_total` | `formatCurrency` | `"$88,077"` |
| "Average of previous periods" | `baseline_average` | `formatCurrency` | `"$55,334"` |
| "Increase" | `increase_ratio` | `formatPercent(increase_ratio * 100)` | `"59.2%"` |

Renderizado condicional, en este orden de prioridad:

| Condición | Qué muestra en el cuerpo de la tarjeta |
| --- | --- |
| `loading` | Tres filas de `Skeleton`. |
| `error !== null` | El mensaje de error, con `role="alert"` y color `var(--destructive)`. |
| `alerts.length === 0` | **Estado vacío explícito:** la tabla no desaparece; la tarjeta y el umbral siguen visibles y se muestra `EmptyStateMessage` con `"No outcome increases above {formatPercent(appliedThreshold * 100)} in this date range."`, por ejemplo `"No outcome increases above 30.0% in this date range."` |
| `alerts.length > 0` | La tabla con una fila por alerta. |

Siempre se muestra una nota bajo el cuerpo: `"The first month in the selected range is never flagged, because it has no previous periods to compare with."`

Cuándo se vuelven a pedir las alertas: cuando cambia el rango de fechas válido (Funcionalidad 1) o el umbral válido. Los parámetros son `threshold` = umbral válido, `group_by` = `"month"` y las fechas del rango, omitiendo las vacías.

## Funcionalidad 3 — Vista comparativa B2B vs B2C

### Componentes

| Componente | Archivo | Nuevo o modificado | Props |
| --- | --- | --- | --- |
| `DashboardNav` | `dashboard-nav.tsx` | Nuevo | `DashboardNavProps` |
| `BusinessComparisonView` | `business-comparison-view.tsx` | Nuevo | `BusinessComparisonViewProps` |
| `BusinessLinePanel` | `business-line-panel.tsx` | Nuevo (se usa 2 veces) | `BusinessLinePanelProps` |
| `BusinessIncomeChart` | `business-income-chart.tsx` | Nuevo | `BusinessIncomeChartProps` |
| `DateRangePicker` | el de la Funcionalidad 1 | Reutilizado | `DateRangePickerProps` |

### Navegación (`DashboardNav`)

- Dos enlaces: `"Overview"` (`href="#/"`) y `"B2B vs B2C"` (`href="#/business-comparison"`).
- El enlace de `currentView` lleva `aria-current="page"`.
- Va debajo de `DashboardHeader`, en las dos vistas.
- `App` obtiene la vista con `parseDashboardView(window.location.hash)` (`src/lib/`) y la actualiza con el evento `hashchange`. Un hash desconocido muestra `"overview"`.
- En la vista `"business-comparison"`, `DashboardHeader` no recibe `period`, así que su etiqueta de periodo no se muestra.

### `BusinessComparisonView`

Estructura, de arriba abajo:

1. `DateRangePicker`, con el **mismo** rango que la vista `"overview"` (decisión 4).
2. Dos `BusinessLinePanel` en paralelo, primero `"B2B"` y luego `"B2C"`. Van en una sola columna en pantallas chicas y en dos a partir de `lg`.
3. Un `BusinessIncomeChart` a todo el ancho, debajo de los dos paneles.

Datos: `App` hace **dos** llamadas a `/api/metrics/categories/top`, una con `business_type=B2B` y otra con `business_type=B2C`. Las dos llevan `operation_type=income`, `limit=5` y las fechas del rango. Cada respuesta pasa por `toCategoryShareRows` (`src/lib/`, con test) para obtener `rows` y `totalIncome`.

### `BusinessLinePanel`

Título: `businessType` (`"B2B"` o `"B2C"`).

Columnas de la tabla, en el orden de la API (de mayor a menor):

| Columna | Campo | Formato | Ejemplo verificado (B2B, todo el dataset) |
| --- | --- | --- | --- |
| "Category" | `category` | Primera letra en mayúscula | `"Sales"` |
| "Income" | `totalAmount` | `formatCurrency` | `"$557,904"` |
| "Share of total" | `sharePercent` | `formatPercent` | `"90.6%"` |

Pie de la tabla: `"Total: {formatCurrency(totalIncome)}"`, por ejemplo `"Total: $615,541"`.

Renderizado condicional (cada panel por separado):

| Condición | Qué muestra |
| --- | --- |
| `loading` | Tres filas de `Skeleton`. |
| `error !== null` | `error` con `role="alert"`, por ejemplo `"Could not load B2B income categories."`. El otro panel no se ve afectado. |
| `rows.length === 0` | **Top 5 vacío:** el panel mantiene su título y muestra `EmptyStateMessage` con `"No income for {businessType} in this date range."`, sin tabla ni pie. |
| `rows.length` entre 1 y 4 | La tabla con esas filas, sin filas de relleno, y una nota: con 1 fila, `"Only 1 income category has data for {businessType}."`; con 2 a 4, `"Only {n} income categories have data for {businessType}."` Hoy es el caso normal: llegan 2 (`sales`, `others`). |
| `rows.length === 5` | La tabla completa, sin nota. |

### `BusinessIncomeChart`

- Un gráfico de barras de Recharts, igual que los gráficos existentes.
- Dos barras: `"B2B"` con `var(--chart-1)` y `"B2C"` con `var(--chart-4)`. Sobre cada barra va su valor con `formatCurrency`.
- Título `"Total income: B2B vs B2C"`.

| Condición | Qué muestra |
| --- | --- |
| `loading` | `Skeleton` de 280 px de alto, como `IncomeOutcomeChart`. |
| Algún panel tiene error | `EmptyStateMessage` con `"Comparison unavailable: could not load both business lines."` |
| Los dos `totalIncome` son 0 | `EmptyStateMessage` con `"No income data for this date range."` |
| Solo uno es 0 | Las dos barras; la que está en 0 se dibuja sin altura y con su etiqueta `"$0"`. |
| Ambos > 0 | Las dos barras. |

## Funciones puras que necesitan estos componentes

Van en `src/lib/`, cada una con su test (R4). Las firmas usan los tipos de `api-types.ts`, `param-types.ts` y `component-props.ts`.

| Función | Firma | Regla |
| --- | --- | --- |
| `validateDateRange` | `(range: DateRangeFilter) => string \| null` | Devuelve el mensaje de error si hay dos fechas y `start_date > end_date`, comparando texto. Si no, `null`. |
| `parseThreshold` | `(text: string) => number \| null` | Devuelve el número si es finito y está entre 0.01 y 1, ambos incluidos. Si no, `null`. |
| `toCategoryShareRows` | `(entries: TopCategoriesResponse) => { rows: CategoryShareRow[]; totalIncome: number }` | `totalIncome` es la suma de `total_amount`, y `sharePercent = total_amount / totalIncome × 100`. Con `[]` devuelve `{ rows: [], totalIncome: 0 }`, sin dividir por 0. |
| `parseDashboardView` | `(hash: string) => DashboardView` | `"#/business-comparison"` → `"business-comparison"`. Cualquier otro valor → `"overview"`. |
| `formatMonthYearLabel` | `(yearMonth: string) => string` | Ya existe en `financial-utils.ts`; solo hay que exportarla. `"2026-03"` → `"Mar 2026"`. |

## Estado que guarda `App`

| Estado | Tipo | Inicial | Lo usan |
| --- | --- | --- | --- |
| `view` | `DashboardView` | `parseDashboardView(location.hash)` | `DashboardNav` y la elección de vista |
| `dateRange` | `DateRangeFilter` | `{}` | Las tres funcionalidades |
| `availableRange` | `AvailableDateRange \| null` | `null` hasta que responde `/facets` | `DateRangePicker` |
| `thresholdText` | `string` | `"0.3"` | `ThresholdInput` |
| `appliedThreshold` | `number` | `0.3` | Petición de alertas y mensaje vacío |

Si llegan respuestas fuera de orden (el usuario cambia el filtro rápido), solo se usa la de la última petición. El detalle de las llamadas irá en `README.md` (contrato de datos, Fase 4).
