/**
 * Props de los componentes nuevos de las tres funcionalidades.
 * La descripción de cada componente y su renderizado condicional está en
 * `components.md`.
 *
 * - Las props usan los tipos de la Fase 2 (`api-types.ts`, `param-types.ts`).
 * - Los tipos que el front deriva van en `camelCase` (R11).
 * - Ningún componente hace `fetch` ni calcula: recibe datos listos (R4).
 */
import type { BusinessType, Category } from "../src/lib/financial-types";
import type { AlertsResponse, FacetsResponse } from "./api-types";
import type { DateRangeFilter } from "./param-types";

/* ---------- Compartidos ---------- */

/**
 * Rango de fechas válido del dataset, tomado de `FacetsResponse`.
 * Ejemplo verificado: `{ min_date: "2025-11-01", max_date: "2026-10-28" }`.
 */
export type AvailableDateRange = Pick<FacetsResponse, "min_date" | "max_date">;

/** Props de `EmptyStateMessage`: aviso neutro cuando no hay datos que mostrar. */
export interface EmptyStateMessageProps {
  /** Texto visible, en inglés (R13). Ejemplo: `"No movements in this date range."`. */
  message: string;
}

/* ---------- Funcionalidad 1: filtro de rango de fechas ---------- */

/** Props de `DateRangePicker`: los dos inputs de fecha y el rango de referencia. */
export interface DateRangePickerProps {
  /**
   * Rango aplicado. Un input vacío equivale a que su campo no exista, por
   * ejemplo `{ start_date: "2026-10-01" }` cuando solo hay fecha de inicio.
   */
  value: DateRangeFilter;

  /**
   * Rango disponible según `/facets`. Es `null` mientras carga o si `/facets`
   * falla: entonces los inputs funcionan sin `min` ni `max`.
   */
  availableRange: AvailableDateRange | null;

  /**
   * Mensaje de validación, o `null` si el rango es válido.
   * Único valor posible: `"Start date must be on or before end date."`.
   */
  validationError: string | null;

  /**
   * Se llama con el rango nuevo cada vez que cambia un input o se pulsa "Clear".
   * Un input vacío se entrega **sin** su campo, nunca como `""`.
   */
  onChange: (value: DateRangeFilter) => void;
}

/* ---------- Funcionalidad 2: tabla de alertas ---------- */

/** Props de `ThresholdInput`: el input numérico del umbral. */
export interface ThresholdInputProps {
  /**
   * Texto tal como lo escribe el usuario (por ejemplo, `"0.3"`, `"0."` o `""`).
   * Es `string` para no perder estados intermedios mientras se escribe.
   */
  value: string;

  /**
   * Mensaje de validación, o `null` si el valor es válido.
   * Único valor posible: `"Enter a value between 0.01 and 1."`.
   */
  error: string | null;

  /** Se llama con el texto nuevo en cada cambio. */
  onChange: (value: string) => void;
}

/** Props de `AnomalyAlertsCard`: la tarjeta con el umbral y la tabla de alertas. */
export interface AnomalyAlertsCardProps {
  /** Props del `ThresholdInput` que va en la cabecera de la tarjeta. */
  thresholdInput: ThresholdInputProps;

  /**
   * Último umbral válido usado en la petición, como proporción (`0.3`).
   * Se usa en el mensaje vacío: `formatPercent(appliedThreshold * 100)` → `"30.0%"`.
   */
  appliedThreshold: number;

  /** Respuesta de `/api/metrics/alerts` para `appliedThreshold` y el rango activo. */
  alerts: AlertsResponse;

  /** `true` mientras se piden las alertas. */
  loading?: boolean;

  /**
   * Mensaje de error de la petición, o `null`.
   * Valor: `"Could not load alerts. Check that the backend API is running."`.
   */
  error: string | null;
}

/* ---------- Funcionalidad 3: comparativa B2B vs B2C ---------- */

/**
 * Vistas del dashboard. Se eligen con el hash de la URL:
 * `#/` → `"overview"` y `#/business-comparison` → `"business-comparison"`.
 * Cualquier otro hash muestra `"overview"`.
 */
export type DashboardView = "overview" | "business-comparison";

/** Props de `DashboardNav`: los enlaces entre las dos vistas. */
export interface DashboardNavProps {
  /** Vista activa; su enlace se marca con `aria-current="page"`. */
  currentView: DashboardView;
}

/**
 * Una fila de la tabla de categorías de una línea de negocio.
 * Derivada de `CategoryEntry` por `toCategoryShareRows` (`src/lib/`, con test).
 */
export interface CategoryShareRow {
  /** Categoría, copiada de `CategoryEntry.category`. Con `income`: `"sales"` u `"others"`. */
  category: Category;

  /** Total de ingresos de la categoría, copiado de `CategoryEntry.total_amount`. */
  totalAmount: number;

  /**
   * Porcentaje sobre el total de la línea: `totalAmount / suma de totalAmount × 100`.
   * Va de 0 a 100. Se muestra con `formatPercent` → `"90.6%"`.
   */
  sharePercent: number;
}

/** Datos ya calculados de una línea de negocio. */
export interface BusinessLineData {
  /** Filas de la tabla, en el orden de la API (de mayor a menor). Entre 0 y 5. */
  rows: CategoryShareRow[];

  /** Suma de `totalAmount` de las filas. Es `0` si no hay filas. */
  totalIncome: number;

  /** `true` mientras se pide `/categories/top` para esta línea. */
  loading?: boolean;

  /**
   * Mensaje de error de la petición, o `null`.
   * Valor: `"Could not load B2B income categories."` (o B2C).
   */
  error: string | null;
}

/** Props de `BusinessLinePanel`: la tabla top 5 de una línea de negocio. */
export interface BusinessLinePanelProps extends BusinessLineData {
  /** Línea que muestra el panel: `"B2B"` o `"B2C"`. Es el título del panel. */
  businessType: BusinessType;
}

/** Total de ingresos de una línea, para el gráfico comparativo. */
export interface BusinessLineTotal {
  /** `"B2B"` o `"B2C"`. */
  businessType: BusinessType;

  /** Igual a `BusinessLineData.totalIncome` de esa línea. */
  totalIncome: number;
}

/** Props de `BusinessIncomeChart`: un gráfico de barras B2B frente a B2C. */
export interface BusinessIncomeChartProps {
  /** Exactamente dos elementos, en el orden B2B y luego B2C. */
  totals: [BusinessLineTotal, BusinessLineTotal];

  /** `true` si cualquiera de las dos líneas está cargando. */
  loading?: boolean;
}

/** Props de `BusinessComparisonView`: la página completa de la comparativa. */
export interface BusinessComparisonViewProps {
  /** Props del `DateRangePicker` de la vista. Es el mismo rango que el de `"overview"`. */
  dateRangePicker: DateRangePickerProps;

  /** Datos de la línea B2B. */
  b2b: BusinessLineData;

  /** Datos de la línea B2C. */
  b2c: BusinessLineData;
}
