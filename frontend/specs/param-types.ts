/**
 * Tipos de los parámetros de query que envían las tres funcionalidades nuevas.
 *
 * Fuente: `GET /openapi.json` (lo que muestra `/docs`) y llamadas reales al
 * backend local el 2026-11-12. Ver `00-api-exploration.md`.
 *
 * Reglas comunes:
 * - Los nombres se copian tal cual de la API, en `snake_case` (R11).
 * - Todo parámetro es opcional en la API. Si no tiene valor, **se omite** de
 *   la URL: un valor vacío (`?start_date=`) devuelve HTTP 422.
 * - Un valor inválido devuelve HTTP 422 con `detail[]`.
 */
import type { BusinessType, OperationType } from "../src/lib/financial-types";

/**
 * Agrupación temporal que aceptan `/api/metrics/alerts` y `/api/metrics/summary`.
 * Valores en `/docs`: `"day"`, `"week"`, `"month"`. Por defecto, `"month"`.
 */
export type GroupBy = "day" | "week" | "month";

/**
 * Rango de fechas opcional, compartido por las tres funcionalidades.
 * Parámetros de `/api/metrics`, `/api/metrics/alerts` y
 * `/api/metrics/categories/top`.
 *
 * Sin ninguna de las dos fechas, la API devuelve todo el dataset. Con una sola,
 * filtra solo por ese lado.
 */
export interface DateRangeFilter {
  /**
   * Primer día incluido, en formato `YYYY-MM-DD` (por ejemplo, `"2026-10-01"`).
   * Es inclusivo: con `start_date` = `end_date` llegan los movimientos de ese día.
   * Formato inválido (`"01-10-2026"`) o texto vacío → HTTP 422.
   * Rango útil: de `FacetsResponse.min_date` a `FacetsResponse.max_date`.
   */
  start_date?: string;

  /**
   * Último día incluido, en formato `YYYY-MM-DD` (por ejemplo, `"2026-10-31"`).
   * Es inclusivo. Formato inválido o texto vacío → HTTP 422.
   *
   * La API no valida que sea posterior a `start_date`: si es anterior, devuelve
   * `[]` con HTTP 200. Esa validación la hace la UI antes de llamar.
   */
  end_date?: string;
}

/**
 * Parámetros de `GET /api/metrics/alerts` (Funcionalidad 2): el umbral más el
 * rango de fechas de la Funcionalidad 1.
 *
 * La API también acepta `business_type`, pero ninguna funcionalidad lo usa en
 * este endpoint, así que no se incluye.
 */
export interface AlertsParams extends DateRangeFilter {
  /**
   * Umbral de subida, como **proporción**: `0.3` = 30 %.
   * Un periodo genera alerta si su `increase_ratio` es mayor que este valor.
   *
   * - API (`/docs`): número ≥ 0, sin máximo; por defecto `0.3`. Con `-0.1` o
   *   `"abc"` devuelve 422; con `1.5`, `[]`.
   * - UI (decisión del PM): de `0.01` a `1.0`, en pasos de `0.01`, por defecto
   *   `0.3`. La UI valida el rango porque la API no lo hace.
   */
  threshold?: number;

  /**
   * Agrupación de los periodos. La Funcionalidad 2 envía siempre `"month"`,
   * aunque sea el valor por defecto, para que `AlertEntry.period` sea `YYYY-MM`.
   */
  group_by?: GroupBy;
}

/**
 * Parámetros de `GET /api/metrics/categories/top` (Funcionalidad 3): tipo de
 * operación, límite, línea de negocio y rango de fechas.
 *
 * Este endpoint no acepta `category`.
 */
export interface TopCategoriesParams extends DateRangeFilter {
  /**
   * Tipo de operación a sumar. Valores: `"income"`, `"outcome"`.
   * Por defecto en la API: `"outcome"`. La Funcionalidad 3 envía siempre
   * `"income"`.
   */
  operation_type?: OperationType;

  /**
   * Máximo de categorías a devolver. Entero de 1 a 20; por defecto, `5`.
   * Fuera de ese rango → HTTP 422. La Funcionalidad 3 envía `5`.
   * Es un máximo: pueden llegar menos.
   */
  limit?: number;

  /**
   * Línea de negocio. Valores: `"B2B"`, `"B2C"`, en mayúsculas (`"b2b"` → 422).
   *
   * Es opcional en la API, pero la Funcionalidad 3 **siempre** lo envía, con una
   * llamada por línea. Sin él, la API suma B2B y B2C, y el endpoint que escribió
   * el PM lo omitía.
   */
  business_type?: BusinessType;
}
