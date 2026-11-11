# Overview del producto

## Qué es

Un **dashboard de métricas financieras** de una sola página: un frontend React que muestra indicadores calculados a partir de movimientos (ingresos y gastos) que sirve una API FastAPI.

- Descripción oficial: "Financial metrics dashboard with a React + TypeScript frontend and a FastAPI backend" (`README.md:18`).
- Es un **proyecto de práctica de 4Geeks Academy** para trabajar reglas y contexto de agentes sobre un proyecto existente (`README.md:5, 20-26`).

## Qué ve el usuario

Una pantalla, en inglés y con tema oscuro forzado (`App.tsx`, `className="dark"`):

| Elemento | Contenido | Evidencia |
|---|---|---|
| Encabezado | "Financial Overview" + periodo calculado de los datos (p. ej. "Nov 2025 – Oct 2026") | `dashboard-header.tsx:15`, `formatPeriodLabel` en `financial-utils.ts` |
| 4 KPIs | Total Income, Total Outcome, Profit, Profit Margin | `kpi-row.tsx:15, 23, 31, 39` |
| Gráfico 1 | Income vs. Outcome por mes (líneas) | `income-outcome-chart.tsx:69` |
| Gráfico 2 | Profit Margin % por mes, con línea de referencia en 0 | `profit-percent-chart.tsx:70, 96` |
| Estados | Skeletons mientras carga, "No data available to display" si está vacío, aviso si falla la API | componentes de `dashboard/`, `App.tsx` |

No hay filtros, navegación, login ni más páginas.

## Modelo de datos

Un **movimiento** (`FinancialMovement`, `routes.py` y `financial-types.ts`):

| Campo | Valores |
|---|---|
| `create_date` | fecha ISO `YYYY-MM-DD` |
| `amount` | número positivo |
| `operation_type` | `income` · `outcome` |
| `category` | `sales` · `suppliers` · `operational` · `administrative` · `others` |
| `business_type` | `B2B` · `B2C` |

**Los datos son ficticios.** No hay base de datos: cada request genera 360 movimientos (30 por mes, 12 meses) con semilla fija `42`, relativos a la fecha de hoy (`routes.py:96-107`). Mismo día → mismos datos; el rango avanza cada mes.

## Qué ofrece la API (y qué usa la UI)

| Endpoint | Para qué | ¿Lo usa la UI? |
|---|---|---|
| `GET /health` | Healthcheck (también lo usa `docker-compose.yml`) | No |
| `GET /api/metrics` | Movimientos, filtrables por fecha, categoría y tipo | **Sí** — única llamada (`App.tsx:20`) |
| `GET /api/metrics/b2b`, `/b2c` | Lo mismo, filtrado por tipo de negocio | No |
| `GET /api/metrics/facets` | Valores posibles de filtros y rango de fechas | No |
| `GET /api/metrics/summary` | Totales por día / semana / mes | No |
| `GET /api/metrics/categories/top` | Categorías con mayor importe | No |
| `GET /api/metrics/comparison` | Neto de un periodo vs. el anterior | No |
| `GET /api/metrics/alerts` | Meses con gasto por encima de la media histórica | No |

9 endpoints en total (`grep -c "@router.get" backend/app/routes.py`). La UI calcula KPIs y agregados mensuales en el navegador con `/api/metrics`, en lugar de usar `/summary`.

## Afirmaciones rechazadas

Cosas que podrían suponerse, pero que el repo **no** respalda:

| Afirmación | Por qué se rechaza |
|---|---|
| "Muestra datos financieros reales de una empresa" | Los datos se generan aleatoriamente (`generate_mock_movements`) |
| "Permite filtrar por B2B/B2C, categoría o fechas" | La API lo permite; la UI no tiene ningún filtro |
| "Muestra alertas, comparativas o top de categorías" | Los endpoints existen; ningún componente los consume |
| "Soporta varias monedas o idiomas" | `formatCurrency` fija `USD` y `en-US` (`financial-utils.ts`); la UI solo está en inglés |
| "Está listo para producción / desplegado" | El contenedor backend corre con `debugpy` y `--reload` (`backend/Dockerfile:12`); no hay configuración de despliegue ni CI |
| "Tiene usuarios o autenticación" | No hay login; CORS abierto a `*` (`main.py:9`) |
| "Tiene un roadmap" | No existe ningún roadmap, issue ni plan en el repo |

## Desconocido

No se puede determinar desde el repo: usuarios objetivo reales más allá del ejercicio, fuente de datos real prevista, entorno de despliegue.
