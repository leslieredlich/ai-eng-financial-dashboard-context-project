# Estado actual

**Fecha:** 2026-11-11 · **Commit:** `21b4d71`

## Qué funciona (verificado)

| Qué | Cómo se verificó |
|---|---|
| Stack completo en Docker | `docker compose up -d` → backend `Healthy` antes de arrancar el frontend; `GET /` en :5173 → 200 |
| Los 8 endpoints `/api/*` | `curl` a través del proxy :5173 → 200 en todos |
| `/health` | `curl localhost:8000/health` → `{"status":"ok"}` |
| Ejecución sin Docker | backend con `.venv` + `uvicorn`, frontend con Node 26 + `npm run dev` |
| Tests backend | `pytest` → 19 passed (local) · 16 passed + 3 skipped (contenedor) |
| Tests frontend | `npm test` → 8 passed, también en contenedor UTC |
| Tipos y lint | `npx tsc -b` (strict) y `npm run lint` sin errores |

## Historial relevante

| Commit | Qué cambió |
|---|---|
| `51b9def` | Fix: agrupación mensual sin desfase de zona horaria, periodo del header calculado, healthcheck de Docker, proxy configurable, eliminado `mock-data.ts` |
| `72ad4b8` | `verification.md`: rastro de la Fase 1 |
| `6fdf76e` | `analysis/phase-2-findings.md`: 29 hallazgos y reglas R1–R25 |
| `21b4d71` | `.agents/rules/` (6 archivos) validados con tareas reales; `strict`, test de contrato, TZ fija en tests |

## Gaps conocidos

Cada uno remite a su hallazgo en `analysis/phase-2-findings.md`.

| Gap | Impacto | Evidencia |
|---|---|---|
| 8 de 9 endpoints sin uso en la UI | Funcionalidad de API que el usuario no ve | `App.tsx:20` es el único `fetch` |
| Sin tests de componentes (Vitest sin DOM) | Cambios de UI sin red de seguridad | T4 — un solo archivo `*.test.ts` |
| `requirements.txt` sin versiones; dependencias de desarrollo dentro de la imagen | Instalaciones distintas según el día; ya aparece un aviso de deprecación de `httpx` | X2, X3 |
| Filtro `business_type` copiado en 4 endpoints | Un endpoint nuevo puede olvidarlo | A5 — `routes.py:281, 299, 315, 354` |
| Sin CI, Prettier ni linter de Python | Nada impide subir código roto o con estilo mezclado | X5, N5 |
| `components.json` con `cssVariables: false` | Un componente generado con shadcn no seguiría el tema | A10 |
| CORS `*` con credenciales | Inseguro si se añade autenticación | A7 — `main.py:9-10` |
| Contenedor backend solo para desarrollo | No hay forma de ejecutar una versión de producción | X3 — `backend/Dockerfile:12` |
| `.agents/skills/` no existe | `AGENTS.md` lo menciona como ubicación de skills | `AGENTS.md:9` |

## Siguientes prioridades

El repo **no tiene roadmap**. Este orden sale de las reglas pendientes de `.agents/rules/` (las marcadas "sin tarea de validación" en `analysis/phase-3-rule-validation.md`), priorizando lo que reduce riesgo antes que lo que añade funciones:

1. **CI mínima** que ejecute `pytest`, `npm test`, `npm run lint` y `tsc -b` (R25). Hoy toda la verificación depende de que alguien la ejecute a mano.
2. **Fijar dependencias de Python** y separar las de desarrollo (R23).
3. **Mover el filtro `business_type` a `filter_movements`** antes de añadir otro endpoint (R3).
4. **Adoptar Prettier** y formatear todo en un commit aparte (R14).
5. Si la UI va a usar más endpoints: crear `src/lib/api.ts` (R5) y configurar Vitest con `jsdom` para testear componentes (R18).
