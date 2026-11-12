/**
 * Tipos de las respuestas de la API que usan las tres funcionalidades nuevas.
 *
 * Fuente: `GET /openapi.json` (lo que muestra `/docs`) y llamadas reales al
 * backend local el 2026-11-12. Ver `00-api-exploration.md`.
 *
 * - Los nombres de campo se copian tal cual de la API, en `snake_case` (R11).
 * - Los enums se importan de `src/lib/financial-types.ts`, que
 *   `backend/tests/test_contract.py` mantiene sincronizado con el backend (R1).
 * - Todos los campos son obligatorios y ninguno es nulo en `/docs`.
 */
import type {
  BusinessType,
  Category,
  FinancialMovement,
  OperationType,
} from "../src/lib/financial-types";

/**
 * Fecha de calendario en formato `YYYY-MM-DD` (por ejemplo, `"2026-10-02"`).
 *
 * Se maneja siempre como texto. No se convierte con `new Date()`: esa función
 * la interpreta como medianoche UTC y, al oeste de UTC, cae en el día anterior.
 */
export type IsoDateString = string;

/**
 * Respuesta de `GET /api/metrics/facets`. Schema en `/docs`: `MetricsFacets`.
 *
 * Usada por la Funcionalidad 1 (rango de fechas de referencia) y la
 * Funcionalidad 3 (límites del filtro de fechas). El endpoint no acepta
 * parámetros: siempre describe el dataset completo.
 */
export interface FacetsResponse {
  /**
   * Tipos de operación presentes en el dataset, en orden alfabético.
   * Valores: `"income"`, `"outcome"`.
   */
  operation_types: OperationType[];

  /**
   * Líneas de negocio presentes en el dataset, en orden alfabético.
   * Valores: `"B2B"`, `"B2C"`.
   */
  business_types: BusinessType[];

  /**
   * Todas las categorías del dataset, en orden alfabético, mezclando las de
   * `income` y las de `outcome`.
   * Valores: `"administrative"`, `"operational"`, `"others"`, `"sales"`,
   * `"suppliers"`.
   *
   * No distingue por línea de negocio (`?business_type=B2B` se ignora), así
   * que no sirve para listar las categorías de cada grupo en la Funcionalidad 3.
   */
  categories: Category[];

  /**
   * Fecha del movimiento más antiguo del dataset, en formato `YYYY-MM-DD`.
   * Valor verificado: `"2025-11-01"`. Es el `min` de los inputs de fecha.
   */
  min_date: IsoDateString;

  /**
   * Fecha del movimiento más reciente del dataset, en formato `YYYY-MM-DD`.
   * Valor verificado: `"2026-10-28"`. Es el `max` de los inputs de fecha.
   */
  max_date: IsoDateString;
}

/**
 * Respuesta de `GET /api/metrics`, el endpoint que el dashboard ya usa y que
 * la Funcionalidad 1 filtra con `start_date` y `end_date`.
 * Cada elemento es un `FinancialMovement` (`src/lib/financial-types.ts`).
 * Está ordenada por `create_date` ascendente. Un rango sin datos devuelve `[]`.
 */
export type MetricsResponse = FinancialMovement[];

/**
 * Un periodo en el que el `outcome` subió por encima del umbral.
 * Elemento de `GET /api/metrics/alerts`. Schema en `/docs`: `MetricsAlert`.
 *
 * Hay alerta solo si `increase_ratio` es **mayor** que el `threshold` enviado;
 * si es igual, no cuenta. El primer periodo del rango nunca genera alerta,
 * porque no tiene periodos anteriores con qué compararse.
 */
export interface AlertEntry {
  /**
   * Periodo agrupado. Con `group_by=month`, que es el que usa la
   * Funcionalidad 2, el formato es `YYYY-MM` (por ejemplo, `"2026-03"`).
   * Con `week` sería `YYYY-Www` y con `day`, `YYYY-MM-DD`.
   */
  period: string;

  /**
   * Suma de los montos de `outcome` del periodo, redondeada a 2 decimales.
   * Siempre ≥ 0. Columna "Outcome" de la tabla.
   */
  outcome_total: number;

  /**
   * Promedio del `outcome` de **todos** los periodos anteriores dentro del
   * rango consultado, redondeado a 2 decimales. Siempre > 0.
   *
   * No es la "media móvil de 3 periodos" que pide el PM: en 2026-03 vale
   * 55334.29 (promedio de 4 meses) y la media de 3 sería 59977.58. Depende de
   * `start_date`: si el rango cambia, el valor cambia.
   * Columna "Average of previous periods".
   */
  baseline_average: number;

  /**
   * Subida relativa: `(outcome_total - baseline_average) / baseline_average`,
   * redondeada a 4 decimales.
   *
   * Es una **proporción**, no un porcentaje: `0.5917` significa 59,17 %.
   * Siempre mayor que el `threshold` enviado. Se muestra como
   * `formatPercent(increase_ratio * 100)` → `"59.2%"`. Columna "Increase".
   */
  increase_ratio: number;
}

/**
 * Respuesta de `GET /api/metrics/alerts`, en orden cronológico por `period`.
 * Si no hay alertas para el umbral y el rango, llega `[]` con HTTP 200: la
 * tabla muestra un estado vacío explícito.
 */
export type AlertsResponse = AlertEntry[];

/**
 * Una categoría con su monto total.
 * Elemento de `GET /api/metrics/categories/top`.
 * Schema en `/docs`: `TopCategoryItem`.
 */
export interface CategoryEntry {
  /**
   * Categoría agrupada. Con `operation_type=income`, que es el que usa la
   * Funcionalidad 3, solo pueden llegar `"sales"` y `"others"`.
   * Con `outcome` llegan `"suppliers"`, `"operational"`, `"administrative"` y
   * `"others"`.
   */
  category: Category;

  /**
   * Tipo de operación sumado. Siempre igual al `operation_type` enviado.
   * Valores: `"income"`, `"outcome"`.
   */
  operation_type: OperationType;

  /**
   * Suma de los montos de esa categoría en el rango y la línea de negocio
   * consultados, redondeada a 2 decimales. Siempre > 0: una categoría sin
   * movimientos no aparece.
   *
   * El "porcentaje sobre el total del grupo" no viene de la API: se calcula en
   * el front como `total_amount / suma de total_amount del grupo × 100`.
   */
  total_amount: number;
}

/**
 * Respuesta de `GET /api/metrics/categories/top`, ordenada por `total_amount`
 * de mayor a menor. Tiene entre 0 y `limit` elementos. Con
 * `operation_type=income` llegan como máximo 2 (`sales` y `others`), aunque
 * `limit` sea 5.
 */
export type TopCategoriesResponse = CategoryEntry[];
