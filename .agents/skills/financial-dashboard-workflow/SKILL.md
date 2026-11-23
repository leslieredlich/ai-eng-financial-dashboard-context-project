# Skill: financial-dashboard-workflow

> Internal project skill for the Company Financial Dashboard.
> Created for the 4Geeks Academy AI Engineering program.

## Description

This skill standardizes development, testing, deployment, and contribution workflows for the Company Financial Dashboard (React + Vite + FastAPI + Docker). It ensures every team member follows the same patterns, producing consistent commits, reliable PRs, and verifiable deployments.

## When to use

Apply this skill when:
- Setting up the project for the first time
- Creating a new branch or feature
- Before pushing a commit
- Before opening a pull request
- Running the application locally or in Docker
- Deploying or verifying a build

## Agent Instructions

### 1. Project Setup & Execution

- **Local frontend:** `cd frontend && npm install && npm run dev`
- **Local backend:** `cd backend && python -m venv .venv && .venv\Scripts\activate && pip install -r requirements.txt && uvicorn main:app --reload --port 8000`
- **Docker (full stack):** `docker compose up --build` (runs frontend on port 5173, backend on port 8000)
- **Environment variables:** Frontend uses `VITE_API_BASE_URL` (default `""` — same origin in Docker, or `http://localhost:8000` for standalone dev)

### 2. Build Verification

Always verify the build compiles before committing:

```bash
cd frontend && npm run build
```

This runs `tsc -b` (TypeScript type-check) followed by `vite build`. Exit code must be 0. Warnings about chunk size > 500 KB are acceptable but should be noted.

### 3. Testing

```bash
# Frontend tests (Vitest)
cd frontend && npm test

# Backend tests (pytest)
cd backend && pytest
```

### 4. Commit Conventions

Use conventional commits. Include a tag referencing the skill or category of change:

```
<type>(<scope>): <description>

[optional body]

Skill: <skill-name>
```

**Types:** `feat`, `fix`, `perf`, `a11y`, `refactor`, `docs`, `chore`, `test`, `style`

**Examples:**
```
a11y(header): add aria-label and keyboard skip link

Skill: accessibility
```

```
perf(charts): hoist static JSX elements and add preconnect hints

Skill: vercel-react-best-practices
```

### 5. Branch Naming

```
feature/<descriptive-name>
fix/<descriptive-name>
chore/<descriptive-name>
```

### 6. Pull Request Checklist

Before opening a PR, verify:
- [ ] `npm run build` succeeds (frontend)
- [ ] `npm test` passes (frontend)
- [ ] `pytest` passes (backend)
- [ ] App runs in Docker: `docker compose up --build`
- [ ] All charts render with sample data
- [ ] No console errors in browser DevTools
- [ ] Lighthouse audit passes (target: 90+ accessibility, 80+ performance)
- [ ] `memory-bank/` updated if baseline quality or workflow changed

### 7. Architecture Notes

- **Frontend:** React 19, Vite 8, Tailwind CSS 4, Recharts 3.8, TypeScript strict, shadcn/ui (new-york), Lucide icons
- **Backend:** FastAPI, Python 3.13, uvicorn, pytest
- **Data:** SQLite via SQLAlchemy, seeded with 6 months of synthetic data
- **Styles:** Tailwind CSS 4 with CSS variables for theming; prefers dark mode via `.dark` class on `<main>`
- **Accessibility:** All charts have `role="img"` with descriptive `aria-label`, skip link for keyboard nav, `aria-live` regions for dynamic KPI values
- **Layout:** `max-w-7xl` centered container, KPI row with `grid-cols-1` → `xl:grid-cols-4`, charts with `xl:grid-cols-2`

### 8. Key Files

| File | Purpose |
|------|---------|
| `frontend/src/App.tsx` | Main app (fetch, KPIs, charts, error/loading states) |
| `frontend/src/components/dashboard/` | Dashboard components (header, KPI cards, charts) |
| `frontend/src/lib/financial-types.ts` | TypeScript types for FinancialMovement, KPIMetrics, etc. |
| `frontend/src/lib/financial-utils.ts` | Pure functions: computeKPIs, computeMonthlyData, formatters |
| `backend/main.py` | FastAPI app, single `/api/metrics` endpoint |
| `backend/database.py` | SQLite + SQLAlchemy models and seed data |
| `docker-compose.yml` | Orchestrates frontend + backend containers |
| `.agents/rules/` | Agent rules for the project (frontend, backend, testing, etc.) |
| `memory-bank/` | Project documentation (current state, tech stack, product overview) |

## Inputs

This skill expects:
- A working clone of the `ai-eng-financial-dashboard-context-project` repository
- Node.js 20+ and npm installed
- Python 3.13+ installed (for backend)
- Docker Desktop installed (optional, for full stack)

## Outputs

- Consistent, verifiable development workflow
- Build-verified commits with conventional messages
- PRs that pass the checklist

## Acceptance Criteria

- [ ] `npm run build` succeeds without errors
- [ ] `npm test` passes
- [ ] `pytest` passes
- [ ] `docker compose up --build` starts both services
- [ ] Commit messages follow the convention with skill tags
- [ ] PR template checklist is complete before merge