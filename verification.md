# Verificación — Fase 1: Comprender el handover

Rastro de la revisión del proyecto hecha con el agente (Claude Code) y contrastada contra el código.

## 1. Mapa del proyecto

| Pieza | Stack | Puerto | Entry point |
|---|---|---|---|
| Frontend | React 19 + TypeScript + Vite 8 + Tailwind 4 + Recharts | 5173 | `index.html` → `src/main.tsx` → `src/App.tsx` |
| Backend | FastAPI + Uvicorn (lanzado por debugpy en Docker) | 8000 (debug 5678) | `app/main.py` → `router` de `app/routes.py` |

- **Datos:** no hay base de datos. El backend genera 360 movimientos falsos (30 por mes, últimos 12 meses) con `random.seed(42)`.
- **Endpoints:** `/health`, `/api/metrics`, `/api/metrics/{b2b,b2c,facets,summary,categories/top,comparison,alerts}`.
- **Conexión:** el front solo llama a `/api/metrics`; el proxy de Vite reenvía `/api` al backend. KPIs y agregados mensuales se calculan en el navegador (`src/lib/financial-utils.ts`).
- **Ejecución:** `docker compose up --build`, o local con `.venv` + `uvicorn` en `backend/` y `npm install` + `npm run dev` en `frontend/` (Node ≥ 20.19).

## 2. Verificación del resumen

✅ correcto · ❌ incorrecto · ❓ no verificable / desactualizado · ⚠️ incompleto

| Afirmación | Estado | Evidencia / corrección |
|---|---|---|
| `main.py` crea la app, CORS y registra el router | ✅ | `backend/app/main.py` |
| Hay 10 endpoints | ✅ | decoradores `@router.get` en `routes.py` |
| El front solo usa `/api/metrics` | ✅ | único `fetch` en `App.tsx` |
| `index.html` → `main.tsx` → `App.tsx` | ✅ | `index.html:11` |
| Componentes dashboard (5) y ui (2) | ✅ | `src/components/` |
| `lib/` = tipos, cálculos, mock-data | ⚠️ | faltaba `utils.ts` (`cn()`) y `financial-utils.test.ts` |
| `mock-data.ts` no se usa | ✅ | ningún import → eliminado |
| Backend arranca con `uvicorn --reload` | ⚠️ | lo lanza `debugpy`, que a su vez lanza uvicorn |
| "El frontend arranca después del backend" | ⚠️ | `depends_on` no esperaba a que la API respondiera → healthcheck añadido |
| Links con número de línea del primer resumen | ❌ | eran líneas de un volcado combinado, no del archivo real; corregidos |
| Título "2024 - Full Year" | ❓ | ya había cambiado; seguía siendo texto fijo → ahora se calcula |
| El proyecto corre en local sin Docker | ❌ | proxy fijo a `backend:8000` (solo existe en Docker) → configurable |

## 3. Problemas encontrados y corregidos

| Problema | Corrección |
|---|---|
| Movimientos del día 1 se contaban en el mes anterior en zonas horarias al oeste de UTC (`new Date("2025-11-01")` = 31-oct en UTC-3) | El mes se lee del texto ISO (`slice(0, 7)`); test añadido |
| Período del header escrito a mano | `formatPeriodLabel()` lo calcula a partir de los datos; tests añadidos |
| Frontend arrancaba antes de que la API respondiera | `healthcheck` sobre `/health` + `condition: service_healthy` |
| Proxy de Vite fijo a `http://backend:8000` | `API_PROXY_TARGET` (Docker lo define; por defecto `localhost:8000`) |
| `mock-data.ts` sin uso | Eliminado |

## 4. Comprobaciones ejecutadas

- Frontend: `tsc -b`, `npm test` (8/8) y `npm run lint` sin errores.
- Backend: `pytest` (15/15).
- Docker: backend `healthy` antes de arrancar el frontend; `GET /api/metrics` vía proxy → 200.
- Bug de zona horaria reproducido con `TZ` en UTC-3: antes `2025-10`, después `2025-11`.

## 5. Pendientes conocidos (fuera de alcance)

- `requirements.txt` sin versiones fijadas.
- Los 9 endpoints restantes del backend no se usan en el frontend.
- El contenedor backend siempre corre en modo desarrollo (`--reload` + debugpy).
