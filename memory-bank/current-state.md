# Estado actual

**Fecha:** 2026-11-23 · **Commit:** `0f23bac` (`feature/agent-skills`)

## Resumen del proyecto

Completadas todas las fases del ejercicio Company Financial Dashboard Skills Project:

- ✅ **Fase 1:** Setup + verificación del memory-bank
- ✅ **Fase 2:** Aplicar skill `accessibility` (addyosmani/web-quality-skills)
- ✅ **Fase 3:** Aplicar skill `vercel-react-best-practices` (vercel-labs/agent-skills)
- ✅ **Fase 4:** Explorar ecosistema + aplicar skill `performance` (addyosmani/web-quality-skills)
- ✅ **Fase 5:** Crear skill interna `repo-internal-conventions` y refinarla
- ✅ **Fase 6:** Actualizar memory-bank con todas las skills, cambios y justificaciones

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
| Build production | `npm run build` → `tsc -b` + `vite build` exitoso (0 errores, 0 warnings TS) |

## Skills aplicadas

| Skill | Versión/Fuente | Cambios realizados |
|---|---|---|
| **`accessibility`** | `addyosmani/web-quality-skills@accessibility` | Título y metadescripción en `index.html`; SkipLink en `App.tsx`; `role="alert"` en error; `aria-label` en regiones; `aria-hidden` en iconos decorativos; `aria-live="polite"` en KPIs dinámicos; `role="img"` con `aria-label` descriptivo en gráficos; `role="status"` en estados vacíos; `aria-labelledby` en charts; `.visually-hidden` class en CSS; media queries `prefers-reduced-motion` y `prefers-contrast: high` |
| **`vercel-react-best-practices`** | `vercel-labs/agent-skills@vercel-react-best-practices` | `preconnect` y `dns-prefetch` para backend API en `index.html`; verificación de reglas: sin componentes inline, sin barrel imports, sin `&&` en condicionales numéricos |
| **`performance`** | `addyosmani/web-quality-skills@performance` | Code-splitting con React.lazy+Suspense (597 kB → 243 kB inicial); vendor/charts code splitting en vite.config.ts; React.memo en IncomeOutcomeChart y ProfitPercentChart; hero.png eliminado |
| **`financial-dashboard-workflow`** | Skill interna del proyecto | `.agents/skills/financial-dashboard-workflow/SKILL.md` — workflow estandarizado de setup, build, test, commits, PR checklist, y notas de arquitectura. Actualizada a v2.0 con formato refinado: YAML frontmatter, objetivo claro, inputs, outputs y criterios de aceptación. |
| **`repo-internal-conventions`** | Skill interna del proyecto | `.skills/repo-internal-conventions/SKILL.md` — Convenciones específicas del repo que las skills comunitarias no cubren: 8 reglas (SWR, timezone, Docker healthcheck, shadcn/cssVariables, CORS env, componentes, requirements.txt, assets no usados). Aplicada en este repo: 4 fixes realizados. |

### Fixes aplicados por `repo-internal-conventions`

| Regla | Archivo | Cambio | Verificación |
|---|---|---|---|
| **R5 — CORS solo para dev** | `backend/app/main.py` | `allow_origins=["*"]` → lee de `CORS_ORIGINS` env var (fallback localhost:5173,3000) | Build OK, sin errores |
| **R7 — requirements.txt con versiones** | `backend/requirements.txt` | 7 dependencias version-pinned (fastapi 0.162.4, uvicorn 0.54.0, sqlalchemy 2.0.40, debugpy 1.8.22, pytest 9.2.0, pytest-cov 7.1.0, httpx 0.28.1) | Build OK |
| **R2 — Zona horaria UTC en tests** | `backend/tests/conftest.py` | `os.environ.setdefault("TZ", "UTC")` + `time.tzset()` | 19 tests pasan |
| **R4 — cssVariables: true** | `frontend/components.json` | `"cssVariables": false` → `true` | Build OK, tema consistente |

## Exploración del ecosistema de skills

### Skills evaluadas con `npx skills find`

| Tema | Comando | Candidatos destacados |
|---|---|---|
| Rendimiento | `npx skills find performance` | **addyosmani/web-quality-skills@performance** (1.4M installs, 46.2K ⭐) |
| Testing | `npx skills find testing` | `antfu/skills@vitest` (49.2K installs), `anthropics/skills@webapp-testing` |
| TypeScript | `npx skills find typescript` | `wshobson/agents@typescript-advanced-types` |
| SEO | `npx skills find seo` | `addyosmani/web-quality-skills@seo`, `firecrawl/firecrawl-workflows@firecrawl-seo-audit` |

### Justificación personal — por qué elegí la skill de rendimiento

Cuando mi tech lead me pidió que explorara el ecosistema de skills, ejecuté `npx skills find` con varios temas para ver qué había disponible. Estas fueron las skills que encontré y por qué tomé cada decisión:

#### 🥇 **Elegí `addyosmani/web-quality-skills@performance`**

Lo primero que noté fue que esta skill viene del **mismo repositorio** que la skill de accesibilidad que ya habíamos aplicado (`addyosmani/web-quality-skills`). Eso me gustó porque:

- **Ya conocía la estructura**: las reglas, el formato de auditoría y los criterios de verificación son los mismos. No tuve que aprender un formato nuevo.
- **Se complementan bien**: accesibilidad mejoró la experiencia para usuarios con tecnologías asistivas; rendimiento mejora la experiencia para **todos** los usuarios, especialmente en conexiones lentas.

Además, cuando revisé qué verificaba esta skill, vi que cubría cosas que **directamente afectaban a nuestro dashboard**:

- ✅ **Core Web Vitals** (LCP, CLS, INP) — métricas que Google mide en producción
- ✅ **Tamaño del bundle** — nuestro JS inicial pesaba 597 kB 😱
- ✅ **Carga diferida** (lazy loading) — perfecto para los componentes de Recharts que son pesados (~350 kB)
- ✅ **Optimización de recursos** — imágenes no usadas, chunks grandes

Y lo mejor: la skill me dio un **objetivo claro** — mantener el JS inicial bajo 300 kB. Antes de aplicarla estábamos en 597 kB. Después de aplicar sus recomendaciones (código dividido en partes, lazy loading con React.lazy, separar librerías en chunks), el bundle inicial bajó a **~243 kB**. Esa es una mejora que puedo medir y mostrar.

#### ❌ **Skills que no elegí y por qué**

| Skill que encontré | Por qué no la usé ahora |
|---|---|
| `antfu/skills@vitest` — testing | El proyecto ya tiene 8 tests con Vitest y funcionan bien. Mejorar los tests es importante pero para otro momento. El foco de este ejercicio era mejorar lo que ya existe, no escribir más tests. |
| `addyosmani/web-quality-skills@seo` — SEO para motores de búsqueda | Este dashboard lo usa el equipo de finanzas internamente, no es un sitio web público. Google no va a indexar esto. No vale la pena invertir tiempo en SEO ahora. |
| `wshobson/agents@typescript-advanced-types` — tipos avanzados de TypeScript | Ya tenemos TypeScript en modo estricto. La skill enseña patrones avanzados, pero no tenemos ningún error de tipos ni bug causado por tipos. Arreglar algo que no está roto. |

**En resumen**: elegí `performance` porque atacaba un problema real y medible (bundle de 597 kB → 243 kB), venía del mismo ecosistema que ya conocía (addyosmani/web-quality-skills), y se complementaba con las skills anteriores sin pisarlas. Las otras skills las dejé anotadas como recomendación para el futuro.

## Skills instaladas disponibles

| Skill | Ruta | Origen |
|---|---|---|
| `accessibility` | `.agents/skills/accessibility/SKILL.md` | Comunidad (`addyosmani/web-quality-skills`) |
| `vercel-react-best-practices` | `.agents/skills/vercel-react-best-practices/SKILL.md` | Comunidad (`vercel-labs/agent-skills`) |
| `performance` | `.agents/skills/performance/SKILL.md` | Comunidad (`addyosmani/web-quality-skills`) |
| `financial-dashboard-workflow` | `.agents/skills/financial-dashboard-workflow/SKILL.md` | **Interna del proyecto** |
| `repo-internal-conventions` | `.skills/repo-internal-conventions/SKILL.md` | **Interna del proyecto** |

## Cómo cargar una skill en el agente

Cada skill tiene su propio archivo `SKILL.md`. Para cargarla y que el agente la aplique:

1. **Por nombre de skill** (si está registrada en el sistema):
   ```
   Carga la skill <nombre> y aplícala al proyecto
   ```
2. **Por ruta de archivo** (para skills internas en `.skills/`):
   ```
   Carga la skill desde .skills/repo-internal-conventions/SKILL.md y aplícala al proyecto
   ```
3. **Desde el ecosistema skills.sh**:
   ```
   npx skills add <repo>/<repo> -s <skill-name> -y
   ```

## Cambios en accesibilidad (detalle)

### HTML (`index.html`)
- Título cambiado de "frontend" a **"Financial Overview Dashboard"** (descriptivo para screen readers y SEO)
- Meta description agregada para resumen ejecutivo
- `preconnect` + `dns-prefetch` para API backend (mejora performance de carga)

### App.tsx
- Componente `SkipLink` agregado: enlace "Skip to main content" visible solo al recibir foco
- `role="alert"` en el contenedor de error para notificar inmediatamente a lectores de pantalla
- `tabIndex={-1}` en `<main>` para que el skip link pueda enfocarlo
- `role="region"` + `aria-label="Dashboard content"` en el contenedor principal de contenido
- Secciones con `aria-label` descriptivo: "Key performance indicators", "Financial charts"

### DashboardHeader
- `aria-hidden="true"` en el icono decorativo (LayoutDashboard)
- `aria-label` en el header y en el badge de periodo

### KPICard
- `aria-hidden="true"` en contenedores de iconos decorativos
- `aria-live="polite"` + `aria-atomic="true"` en el valor de KPI (lectores de pantalla anuncian cambios dinámicos)
- Texto descriptivo "Loading..." durante carga

### IncomeOutcomeChart
- `role="img"` envolviendo el gráfico con `aria-label` que resume: cantidad de meses, rango de ingresos y egresos
- `aria-labelledby` vinculando el título al SVG del gráfico
- `role="status"` en mensaje de "No data available"
- ID único `"income-outcome-title"` en CardTitle para referencia desde `aria-labelledby`

### ProfitPercentChart
- Misma estructura que IncomeOutcomeChart: `role="img"` con resumen de datos, `aria-labelledby`, `role="status"` en vacío

### CSS (`index.css`)
- `.visually-hidden` class: posiciona contenido fuera de pantalla pero accesible a lectores (clip rect)
- `@media (prefers-reduced-motion: reduce)`: desactiva animaciones y transiciones para personas con sensibilidad al movimiento
- `@media (prefers-contrast: high)`: fuerza `border-color: currentColor` y ajusta variables de color para contraste máximo

## Historial relevante — rama `feature/agent-skills`

| Commit | Qué cambió |
|---|---|
| `51b9def` | Fix: agrupación mensual sin desfase de zona horaria, periodo del header calculado, healthcheck de Docker, proxy configurable, eliminado `mock-data.ts` |
| `72ad4b8` | `verification.md`: rastro de la Fase 1 |
| `6fdf76e` | `analysis/phase-2-findings.md`: 29 hallazgos y reglas R1–R25 |
| `21b4d71` | `.agents/rules/` (6 archivos) validados con tareas reales; `strict`, test de contrato, TZ fija en tests |
| `ff95c21` | docs(skills): create internal financial-dashboard-workflow skill |
| `8b025e4` | chore(skills): add installed community skills (accessibility, vercel-react-best-practices) |
| `624fc3b` | refactor(dashboard): apply vercel-react-best-practices skill |
| `50b512d` | feat(index.html): add theme-color, color-scheme, favicon |
| `26b5e3f` | perf(dashboard): apply web-quality-skills@performance skill |
| `e67c13a` | docs(memory-bank): document performance skill changes and installed skills |
| `9659dc0` | docs(memory-bank): document ecosystem exploration and performance justification |
| `6f7d510` | docs(memory-bank): reword performance justification in first person |
| `5191fdd` | docs(skills): create repo-internal-conventions skill and refine workflow skill |
| `0f23bac` | feat: apply internal skill repo-internal-conventions - 4 fixes (CORS env, requirements.txt versions, TZ in tests, cssVariables) |

## Gaps conocidos

Cada uno remite a su hallazgo en `analysis/phase-2-findings.md`.

| Gap | Impacto | Evidencia | Estado |
|---|---|---|---|
| 8 de 9 endpoints sin uso en la UI | Funcionalidad de API que el usuario no ve | `App.tsx:20` es el único `fetch` | 🔴 Pendiente |
| Sin tests de componentes (Vitest sin DOM) | Cambios de UI sin red de seguridad | T4 — un solo archivo `*.test.ts` | 🔴 Pendiente |
| `requirements.txt` sin versiones | Instalaciones distintas según el día | X2, X3 | ✅ **Fijado** por `repo-internal-conventions` R7 |
| Filtro `business_type` copiado en 4 endpoints | Un endpoint nuevo puede olvidarlo | A5 — `routes.py:281, 299, 315, 354` | 🔴 Pendiente |
| Sin CI, Prettier ni linter de Python | Nada impide subir código roto o con estilo mezclado | X5, N5 | 🔴 Pendiente |
| `components.json` con `cssVariables: false` | Componente generado no sigue el tema | A10 | ✅ **Fijado** por `repo-internal-conventions` R4 |
| CORS `*` con credenciales | Inseguro si se añade autenticación | A7 — `main.py:9-10` | ✅ **Fijado** por `repo-internal-conventions` R5 |
| Contenedor backend solo para desarrollo | Sin versión de producción | X3 — `backend/Dockerfile:12` | 🔴 Pendiente |
| `.agents/skills/` con skills instaladas | Skills disponibles pero no versionadas en el repo | `AGENTS.md:9` | ⚠️ Depende del `.gitignore` del repo |

## Siguientes prioridades

El repo **no tiene roadmap**. Este orden sale de las reglas pendientes de `.agents/rules/` (las marcadas "sin tarea de validación" en `analysis/phase-3-rule-validation.md`), priorizando lo que reduce riesgo antes de lo que añade funciones:

1. **CI mínima** que ejecute `pytest`, `npm test`, `npm run lint` y `tsc -b` (R25). Hoy toda la verificación depende de que alguien la ejecute a mano.
2. **Mover el filtro `business_type` a `filter_movements`** antes de añadir otro endpoint (R3).
3. **Adoptar Prettier** y formatear todo en un commit aparte (R14).
4. Si la UI va a usar más endpoints: crear `src/lib/api.ts` (R5) y configurar Vitest con `jsdom` para testear componentes (R18).
5. Contenedor backend de producción (sin `--reload` ni `debugpy`).

## Lo aprendido

Este ejercicio demostró cómo escalar calidad en un codebase heredado usando **skills de agente** en lugar de checklists manuales. Cada fase enseñó algo distinto:

1. **Skills comunitarias** (`accessibility`, `performance`): resolvieron problemas genéricos (accesibilidad, bundle size) con instrucciones probadas por miles de desarrolladores.
2. **Skills técnicas** (`vercel-react-best-practices`): guiaron sobre patrones específicos del stack que no conocíamos — aunque varias reglas eran para Next.js, el filtro nos enseñó que **el agente también sabe descartar**.
3. **Exploración del ecosistema** (`npx skills find`): descubrimos skills de testing, SEO y TypeScript. Elegir no aplicarlas fue tan importante como elegir aplicar performance.
4. **Skill interna** (`repo-internal-conventions`): capturó el conocimiento específico del repo que ninguna skill comunitaria cubre — timezone en backend, CORS seguro, shadcn config, requirements versionados.
5. **Trazabilidad**: cada cambio en la rama `feature/agent-skills` referencia la skill que lo originó. Un nuevo desarrollador puede leer el historial y entender *por qué* se hizo cada cambio.
