---
name: financial-dashboard-workflow
description: Standardize development, testing, and contribution workflows for the Company Financial Dashboard (React+Vite+FastAPI+Docker). Use for "setup project", "run tests", "commit changes", "open PR", or "verify build".
license: MIT
metadata:
  author: financial-dashboard-team
  version: "2.0"
---

# financial-dashboard-workflow

> Skill interna del proyecto — workflow estandarizado de desarrollo, build, test, commits y PRs.
> Creada para el programa AI Engineering de 4Geeks Academy.

## Cuándo usarla

- Al configurar el proyecto por primera vez
- Al crear una rama nueva o empezar una feature
- Antes de hacer commit
- Antes de abrir un Pull Request
- Al correr la app localmente o en Docker
- Al desplegar o verificar el build

## Objetivo

Que todo el equipo siga los mismos pasos: setup → build → test → commit → PR. Sin adivinar comandos, sin commits inconsistentes, sin PRs que rompen algo.

## Inputs esperados

- Un clon del repo `ai-eng-financial-dashboard-context-project`
- Node.js 20+ y npm instalados
- Python 3.13+ instalado (para el backend)
- Docker Desktop instalado (opcional, para el stack completo)

## Output esperado

- Commits con mensajes consistentes (Conventional Commits + Skill tag)
- Build verificado antes de cada commit
- PRs que pasan el checklist completo

## Instrucciones para el agent

### 1. Setup y ejecución

```bash
# Frontend local
cd frontend && npm install && npm run dev

# Backend local (Windows)
cd backend && python -m venv .venv && .venv\Scripts\activate && pip install -r requirements.txt && uvicorn main:app --reload --port 8000

# Stack completo en Docker
docker compose up --build
# → frontend en :5173, backend en :8000

# Variables de entorno
# VITE_API_BASE_URL: "" (mismo origen en Docker), "http://localhost:8000" (standalone)
```

### 2. Build — siempre verificar antes de commit

```bash
cd frontend && npm run build
# → Ejecuta tsc -b (type check) + vite build
# → Exit code 0 = OK
# → Warnings de chunk > 500 kB son aceptables pero anotarlos
```

### 3. Tests

```bash
# Frontend (Vitest)
cd frontend && npm test

# Backend (pytest)
cd backend && pytest
```

### 4. Commits — formato obligatorio

```
<tipo>(<scope>): <descripción en imperativo>

[opcional: cuerpo explicando el cambio]

Skill: <nombre-de-la-skill>
```

**Tipos:** `feat`, `fix`, `perf`, `a11y`, `refactor`, `docs`, `chore`, `test`, `style`

**Ejemplos:**
```
a11y(header): add aria-label and keyboard skip link

Skill: accessibility

---

perf(charts): hoist static JSX elements and add preconnect hints

Skill: vercel-react-best-practices
```

### 5. Ramas (branch naming)

```
feature/<nombre-descriptivo>
fix/<nombre-descriptivo>
chore/<nombre-descriptivo>
```

### 6. Checklist para Pull Request

Antes de abrir un PR, verificar:

- [ ] `npm run build` pasa (frontend)
- [ ] `npm test` pasa (frontend)
- [ ] `pytest` pasa (backend)
- [ ] App funciona en Docker: `docker compose up --build`
- [ ] Todos los gráficos renderizan con datos de ejemplo
- [ ] Sin errores en consola del browser (DevTools)
- [ ] Lighthouse: accesibilidad 90+, rendimiento 80+
- [ ] `memory-bank/` actualizado si cambió la línea base o el workflow

### 7. Notas de arquitectura (contexto rápido)

| Capa | Stack |
|---|---|
| Frontend | React 19, Vite 8, Tailwind CSS 4, Recharts 3.8, TypeScript strict, shadcn/ui (new-york), Lucide icons |
| Backend | FastAPI, Python 3.13, uvicorn, pytest |
| Datos | SQLite via SQLAlchemy, 6 meses de datos sintéticos |
| Estilos | Tailwind CSS 4 con variables CSS; dark mode via `.dark` class en `<main>` |
| Accesibilidad | Charts con `role="img"` + `aria-label`, skip link, `aria-live` en KPIs |
| Layout | `max-w-7xl` centrado, KPIs grid 1→4, charts grid 1→2 (xl) |

### 8. Archivos clave

| Archivo | Propósito |
|---|---|
| `frontend/src/App.tsx` | App principal (fetch con SWR, KPIs, charts, loading/error/empty) |
| `frontend/src/components/dashboard/` | Componentes del dashboard (header, KPI cards, charts) |
| `frontend/src/lib/financial-types.ts` | Tipos TypeScript (FinancialMovement, KPIMetrics, etc.) |
| `frontend/src/lib/financial-utils.ts` | Funciones puras: computeKPIs, computeMonthlyData, formateadores |
| `backend/main.py` | FastAPI app, endpoint `/api/metrics` |
| `backend/database.py` | SQLite + SQLAlchemy modelos y datos de semilla |
| `docker-compose.yml` | Orquesta frontend + backend |
| `.agents/rules/` | Reglas del proyecto (frontend, backend, testing, etc.) |
| `.skills/repo-internal-conventions/SKILL.md` | Skill interna con convenciones específicas del repo |
| `memory-bank/` | Documentación del proyecto (estado actual, tech stack, overview) |

## Criterios de aceptación

- [ ] `npm run build` exitoso sin errores
- [ ] `npm test` pasa
- [ ] `pytest` pasa
- [ ] `docker compose up --build` levanta ambos servicios
- [ ] Mensajes de commit siguen el formato con skill tags
- [ ] Checklist del PR completo antes del merge