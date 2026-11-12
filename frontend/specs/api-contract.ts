/**
 * Contrato de datos: qué parámetros envía y qué respuesta recibe cada endpoint
 * que usan las tres funcionalidades. La explicación de cada uno está en
 * `README.md`.
 *
 * Fuente: `GET /openapi.json` (lo que muestra `/docs`) del backend local,
 * verificado el 2026-11-12.
 *
 * Es solo un mapa de tipos: no hace peticiones. La implementación de
 * `src/lib/api.ts` (R5) debe respetarlo.
 */
import type {
  AlertsResponse,
  FacetsResponse,
  MetricsResponse,
  TopCategoriesResponse,
} from "./api-types";
import type {
  AlertsParams,
  DateRangeFilter,
  TopCategoriesParams,
} from "./param-types";

/** Endpoint sin parámetros de query (`/api/metrics/facets`). */
export type NoParams = Record<string, never>;

/**
 * Un error de validación dentro de una respuesta HTTP 422.
 * Schema en `/docs`: `ValidationError`.
 */
export interface ValidationErrorItem {
  /** Dónde está el error, por ejemplo `["query", "start_date"]`. */
  loc: (string | number)[];

  /** Motivo en inglés, por ejemplo `"Input should be 'B2B' or 'B2C'"`. */
  msg: string;

  /** Código del error, por ejemplo `"literal_error"` o `"float_parsing"`. */
  type: string;

  /** Valor recibido. `/docs` no le da tipo, por eso es `unknown`. */
  input?: unknown;

  /** Datos extra del error, por ejemplo `{ ge: 1 }`. */
  ctx?: Record<string, unknown>;
}

/**
 * Cuerpo de una respuesta HTTP 422. Schema en `/docs`: `HTTPValidationError`.
 * La UI nunca muestra `detail` al usuario: lo trata como cualquier otro error.
 */
export interface HttpValidationError {
  detail: ValidationErrorItem[];
}

/**
 * Mapa de endpoints. Todos son `GET` y devuelven JSON con HTTP 200.
 * Los que aceptan parámetros devuelven HTTP 422 (`HttpValidationError`) si uno
 * es inválido.
 */
export interface ApiContract {
  /** F1 y F3: rango de fechas disponible. Nunca devuelve 422. */
  "/api/metrics/facets": { params: NoParams; response: FacetsResponse };

  /** F1: movimientos del rango, para KPIs y gráficos del overview. */
  "/api/metrics": { params: DateRangeFilter; response: MetricsResponse };

  /** F2: periodos con subida de `outcome` sobre el umbral. */
  "/api/metrics/alerts": { params: AlertsParams; response: AlertsResponse };

  /** F3: top de categorías de ingreso, una llamada por línea de negocio. */
  "/api/metrics/categories/top": {
    params: TopCategoriesParams;
    response: TopCategoriesResponse;
  };
}

/** Rutas del contrato, por ejemplo `"/api/metrics/alerts"`. */
export type ApiPath = keyof ApiContract;
