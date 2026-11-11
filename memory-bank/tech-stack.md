# Stack tecnológico

## Lenguajes

| Lenguaje | Dónde | Versión |
|---|---|---|
| TypeScript (modo `strict`) | `frontend/src/` | `~6.0.2` → resuelta `6.0.2` |
| Python | `backend/` | 3.13 en Docker (`backend/Dockerfile:1`); mínimo 3.10 por la sintaxis `X \| None` |
| CSS (Tailwind 4 + variables) | `frontend/src/index.css` | — |

## Frontend (`frontend/`)

Versiones: rango declarado en `package.json` → versión resuelta en `package-lock.json`.

| Paquete | Rol | Versión |
|---|---|---|
| `react`, `react-dom` | UI | `^19.2.4` → 19.2.5 |
| `vite` | Dev server, build y proxy `/api` | `^8.0.4` → 8.0.8 (requiere Node ≥ 20.19) |
| `tailwindcss` + `@tailwindcss/vite` | Estilos | `^4.2.2` → 4.2.2 |
| `recharts` | Gráficos | `^3.8.1` → 3.8.1 |
| `lucide-react` | Iconos | `^1.8.0` → 1.8.0 |
| `clsx` + `tailwind-merge` | Helper `cn()` (`src/lib/utils.ts`) | — |
| `class-variance-authority` | Declarada, sin uso actual en `src/` | — |
| `vitest` | Tests | `^4.1.4` → 4.1.4 |
| `eslint` + `typescript-eslint` + plugins React | Lint | `^9.39.4` → 9.39.4 |

Componentes base de **shadcn/ui** (estilo `new-york`, `components.json`) en `src/components/ui/`. Alias `@/` → `src/` (`vite.config.ts`, `tsconfig.app.json`).

## Backend (`backend/`)

`requirements.txt` **no fija versiones**. Versiones que instaló `pip` el 2026-11-11:

| Paquete | Rol | Versión instalada |
|---|---|---|
| `fastapi` (+ `pydantic`, `starlette`) | API y validación | 0.162.4 (2.14.3, 1.10.0) |
| `uvicorn[standard]` | Servidor ASGI | 0.54.0 |
| `debugpy` | Depurador remoto (puerto 5678) | 1.8.22 |
| `pytest`, `pytest-cov`, `httpx` | Tests (`TestClient`) | 9.2.0, —, 0.28.1 |

Estructura: `app/main.py` (app + CORS) y `app/routes.py` (modelos Pydantic, generador de datos, funciones puras de cálculo y endpoints).

## Cómo se conecta

```text
Navegador ──► Vite :5173 ──(/api/*)──► FastAPI :8000
                │                        └─ genera datos mock en cada request
                └─ App.tsx: fetch /api/metrics → lib/financial-utils.ts calcula KPIs y meses
```

- El front llama a rutas relativas `/api/...` (`App.tsx:17-20`). El proxy solo cubre `/api`: `/health` solo responde en `:8000`.
- Destino del proxy: `API_PROXY_TARGET` o, si no existe, `http://localhost:8000` (`vite.config.ts`). Docker lo define como `http://backend:8000` (`docker-compose.yml`).
- `VITE_API_BASE_URL` (opcional, `frontend/.env.example`) hace que el front llame directo a otro backend sin pasar por el proxy.

## Infraestructura y ejecución

| Modo | Cómo | Notas |
|---|---|---|
| Docker | `docker compose up --build` | 2 servicios: `frontend` (node:24-alpine) y `backend` (python:3.13-slim). El front espera a que el backend esté `healthy` (healthcheck a `/health`). Código montado por volumen → hot reload |
| Local | ver *How to run without Docker* en `README.md` | `.venv` + `uvicorn` en `backend/`; `npm install` + `npm run dev` en `frontend/` |

Puertos: 5173 (front), 8000 (API, docs en `/docs`), 5678 (`debugpy`).

## Tooling y calidad

| Herramienta | Comando | Configuración |
|---|---|---|
| pytest | `.venv/bin/python -m pytest` (en `backend/`) | `backend/tests/` — 19 tests; 3 de contrato se omiten dentro del contenedor |
| Vitest | `npm test` | `vite.config.ts` → `test.env.TZ = America/Santiago`; 8 tests en `src/lib/` |
| TypeScript | `npx tsc -b` | `strict: true` en `tsconfig.app.json` y `tsconfig.node.json` |
| ESLint | `npm run lint` | `eslint.config.js` |
| Versión de Node | — | `engines >=20.19.0`, `.nvmrc` = 24 |

No hay: Prettier, linter de Python, CI ni base de datos.
