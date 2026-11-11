# Fase 2 — Hallazgos de ingeniería y reglas propuestas

Análisis del repo hecho con el agente (Claude Code). Objetivo: dejar a futuros contribuidores (personas o agentes) las convenciones que conviene seguir y los patrones que pueden romper algo sin avisar.

**Método**

1. Recorrer backend, frontend, configuración e historial de git buscando patrones.
2. Verificar cada candidato contra el código. Varios se comprobaron ejecutando código (marcados con 🧪).
3. Descartar lo vago o sin impacto real (ver §7).
4. Agrupar por categoría y convertir cada hallazgo en una regla que cita al menos un hecho del repo.

Tipos: **Convención** = algo que el repo ya hace bien y hay que mantener. **Riesgo** = algo que puede romper el proyecto a quien no lo sepa.

> Los números de línea corresponden al commit `72ad4b8`.

---

## 1. Arquitectura

| # | Tipo | Hallazgo | Evidencia |
|---|---|---|---|
| A1 | Convención | La lógica de negocio del frontend vive en funciones puras de `lib/`; los componentes solo reciben datos por props y pintan. | `App.tsx` llama a `computeKPIs` / `computeMonthlyData`; `components/dashboard/*` no hacen cálculos ni `fetch` |
| A2 | Convención | En el backend, la lógica está en funciones puras separadas de los endpoints, lo que permite testearlas sin HTTP. | `routes.py:125` `filter_movements`, `:161` `summarize_movements`, `:190` `build_top_categories`, `:219` `detect_outcome_alerts` |
| A3 | Riesgo | Los tipos del dominio están **duplicados a mano** en backend y frontend. Si se cambia uno solo, ambos lados dejan de coincidir sin error de compilación. | `backend/app/routes.py:11-14` (`Literal[...]`) vs `frontend/src/lib/financial-types.ts:1-3` |
| A4 | Riesgo 🧪 | `generate_mock_movements` llama a `random.seed(42)` sobre el generador **global** de Python en cada request. Cualquier otro código que use `random` queda determinista. | `routes.py:96`; llamado desde 8 endpoints (`:255`…`:386`). Verificado: `random.random()` devuelve el mismo valor tras cada llamada a `/api/metrics` |
| A5 | Riesgo | El filtro por `business_type` está copiado en 4 endpoints en lugar de estar en `filter_movements`. Un endpoint nuevo puede olvidarlo. | `routes.py:278, 296, 312, 351` |
| A6 | Riesgo 🧪 | Los datos se generan relativos a `date.today()`: el rango cambia cada mes. Cualquier fecha fija en código o tests queda obsoleta. | `routes.py:65` `_year_for_month`, `:97`. Rango actual: `2025-11-01 → 2026-10-28` |
| A7 | Riesgo | CORS abierto a cualquier origen **con** credenciales. Aceptable con datos falsos; peligroso si se añade autenticación. | `backend/app/main.py:9-10` |
| A8 | Riesgo | No hay capa de API en el frontend: el `fetch` y la URL base están dentro de `App.tsx`. El segundo endpoint que se consuma tenderá a copiarlo. | `App.tsx:17-24` |
| A9 | Convención | Los colores salen de tokens CSS definidos dos veces (tema claro `:root` y oscuro `.dark`); los componentes usan `var(--chart-*)` / `var(--*-badge)`, nunca hex. La app fuerza el tema oscuro. | `index.css:25-39` y `:62-75`; `income-outcome-chart.tsx:104`; `App.tsx:50` |
| A10 | Riesgo | `components/ui/` viene de shadcn, pero `components.json` declara `"cssVariables": false` mientras el tema sí usa variables. Un componente nuevo generado con el CLI no seguiría el tema. | `components.json:10` vs `card.tsx:10` (`bg-card`) e `index.css` |

## 2. Naming

| # | Tipo | Hallazgo | Evidencia |
|---|---|---|---|
| N1 | Convención | Archivos en `kebab-case`, componentes en `PascalCase` con **named exports**. Única excepción: `App` (default export). | `components/dashboard/kpi-card.tsx:34` `export function KPICard`; `App.tsx:78` |
| N2 | Convención | Los campos de la API van en `snake_case` y el frontend **los conserva** en el tipo de entrada; los tipos derivados en el front usan `camelCase`. | `financial-types.ts` `FinancialMovement.create_date` vs `KPIMetrics.totalIncome` |
| N3 | Convención | El dominio usa **`outcome`** (no `expense`) de punta a punta: API, tipos, variantes de UI y tokens CSS. | `routes.py:11`, `kpi-card.tsx:11`, `index.css:26` `--chart-outcome` |
| N4 | Riesgo | Idioma mezclado: toda la UI está en inglés, pero el mensaje de error está en español. | `App.tsx:41` vs `kpi-row.tsx:15` `"Total Income"` |
| N5 | Riesgo | Estilo de código mezclado sin formateador: comillas dobles y `;` en `App.tsx`/`financial-utils.ts`, simples y sin `;` en `kpi-card.tsx`/`card.tsx`/`main.tsx`. | No existe `.prettierrc` ni `.editorconfig` |

## 3. Testing

| # | Tipo | Hallazgo | Evidencia |
|---|---|---|---|
| T1 | Convención | Backend: tests en `backend/tests/`, con `TestClient` para endpoints y llamadas directas para funciones puras. Frontend: tests junto al código (`*.test.ts`) con Vitest. | `test_routes.py:9`; `src/lib/financial-utils.test.ts` |
| T2 | Riesgo 🧪 | El test de `/comparison` usa marzo 2025, fuera del rango de datos: compara 0 contra 0 y **pasa sin probar nada**. | `test_routes.py:157-160`. Respuesta real: `{current_period: 0.0, previous_period: 0.0, delta_pct: None}` |
| T3 | Riesgo 🧪 | El test de regresión del bug de zona horaria solo falla en husos al oeste de UTC. Docker corre en UTC, así que **no detectaría** que el bug vuelva. | `financial-utils.test.ts` ("keeps first-of-month…"). En el contenedor (`UTC`) el código viejo da `2025-11`, igual que el correcto |
| T4 | Riesgo | Cero tests de componentes: el único archivo de test del frontend es `financial-utils.test.ts`, y Vitest no tiene entorno DOM configurado. | `src/**/*.test.*` → 1 archivo; sin `test.environment` en `vite.config.ts` |

## 4. Documentación

| # | Tipo | Hallazgo | Evidencia |
|---|---|---|---|
| D1 | Riesgo | `AGENTS.md` obliga a leer `.agents/rules`, `.agents/skills` y `memory-bank/`, pero ninguno existe. | `AGENTS.md:6, 9, 12` |
| D2 | Riesgo | Los README solo documentan Docker: no explican cómo correr sin Docker ni cómo lanzar tests. | `README.es.md:42-51`, `README.md:42-51` |
| D3 | Convención | Los commits recientes usan Conventional Commits (`feat:`, `fix:`, `docs:`); los antiguos no. | `git log` (`eeece05 feat: …` vs `Add metrics facets endpoint…`) |

## 5. DX y tooling

| # | Tipo | Hallazgo | Evidencia |
|---|---|---|---|
| X1 | Riesgo 🧪 | TypeScript **sin `strict`**. El código actual ya compila en modo estricto con 0 errores, así que activarlo es gratis hoy y caro mañana. | `tsconfig.app.json` (no hay `strict`). `tsc --strict` → 0 errores |
| X2 | Riesgo 🧪 | `requirements.txt` sin versiones. Instalar hoy ya trae un aviso de deprecación (`httpx` en el `TestClient`). | `backend/requirements.txt`; aviso al correr `pytest` |
| X3 | Riesgo | Dependencias de desarrollo (`pytest`, `pytest-cov`, `debugpy`) mezcladas con las de ejecución y metidas en la imagen. | `requirements.txt`; `backend/Dockerfile:12` siempre arranca con `debugpy` + `--reload` |
| X4 | Riesgo | No se fija la versión de Node. Vite 8 exige ≥ 20.19, y en la Fase 1 falló con Node 20.12. | Sin `engines` en `package.json`, sin `.nvmrc` |
| X5 | Riesgo | No hay CI, ni linter/formateador de Python. Nada impide subir código que rompa tests. | No existen `.github/`, `pyproject.toml`, `ruff.toml` |

---

## 6. Reglas propuestas

Cada regla cita el hallazgo y el hecho del repo que la justifica. Prioridad: **Alta** = evita bugs silenciosos · **Media** = evita deuda o confusión · **Baja** = consistencia.

### Arquitectura

| Regla | Prioridad | Base |
|---|---|---|
| **R1.** Si cambias `OperationType`, `Category` o `BusinessType`, actualiza `routes.py` y `financial-types.ts` en el mismo commit. | Alta | A3: `routes.py:11-14` y `financial-types.ts:1-3` se mantienen a mano |
| **R2.** No uses `random.seed()` global; para datos deterministas usa una instancia propia (`random.Random(seed)`). | Alta | A4: `routes.py:96` resetea el generador global en cada request |
| **R3.** Los filtros comunes van en `filter_movements`, no copiados en cada endpoint. Un endpoint nuevo reutiliza las funciones puras existentes. | Media | A2, A5: `routes.py:278, 296, 312, 351` |
| **R4.** Los cálculos del frontend van en funciones puras de `src/lib/` con su test; los componentes solo presentan. | Media | A1: patrón actual de `App.tsx` y `financial-utils.ts` |
| **R5.** Al consumir un segundo endpoint, extrae los `fetch` a `src/lib/api.ts` usando `API_BASE_URL`. | Media | A8: `App.tsx:17-24` |
| **R6.** Nunca escribas fechas ni rangos fijos sobre los datos mock; calcúlalos desde los datos o desde `date.today()`. | Alta | A6: `routes.py:97`; ya causó T2 y el título fijo de la Fase 1 |
| **R7.** Colores nuevos: crea el token en `:root` **y** en `.dark` de `index.css`, y úsalo con `var(--…)`. Sin hex en componentes. | Baja | A9: `index.css:25-39`, `:62-75` |
| **R8.** No edites a mano `components/ui/`; corrige `"cssVariables": true` en `components.json` antes de generar componentes nuevos con shadcn. | Baja | A10: `components.json:10` |
| **R9.** Si se añade autenticación, reemplaza `allow_origins=["*"]` por una lista explícita de orígenes. | Media | A7: `main.py:9-10` |

### Naming

| Regla | Prioridad | Base |
|---|---|---|
| **R10.** Archivos en `kebab-case`, componentes en `PascalCase` con named export. | Baja | N1 |
| **R11.** No renombres campos de la API en el tipo de entrada (`create_date` sigue siendo `create_date`); usa `camelCase` solo en tipos derivados del front. | Media | N2: `financial-types.ts` |
| **R12.** Usa el vocabulario del dominio: `income` / `outcome` / `net` / `profit`. No introduzcas `expense`, `revenue`, etc. | Media | N3 |
| **R13.** Todos los textos de UI en inglés. | Baja | N4: `App.tsx:41` es la única excepción |
| **R14.** Adopta Prettier en el frontend y formatea todo de una vez en un commit aparte. | Baja | N5 |

### Testing

| Regla | Prioridad | Base |
|---|---|---|
| **R15.** Un test sobre datos mock debe usar fechas dentro del rango real (p. ej. obtenido de `/api/metrics/facets`) y comprobar al menos un valor distinto de cero. | Alta | T2: `test_routes.py:157-160` pasa con 0/0 |
| **R16.** Fija la zona horaria de los tests del frontend a una al oeste de UTC (p. ej. `America/Santiago`) para que los bugs de fechas se reproduzcan en cualquier máquina. | Alta | T3: en UTC el test de regresión no detecta el bug |
| **R17.** Backend: tests en `backend/tests/`; frontend: `*.test.ts(x)` junto al archivo. Todo cambio en `src/lib/` o en `routes.py` lleva test. | Media | T1 |
| **R18.** Antes de añadir tests de componentes, configura `test.environment: "jsdom"` en Vitest. | Baja | T4 |

### Documentación

| Regla | Prioridad | Base |
|---|---|---|
| **R19.** Crea `.agents/rules/` y `memory-bank/`, o ajusta `AGENTS.md` para que no apunte a rutas inexistentes. | Alta | D1: `AGENTS.md:6-12` |
| **R20.** Documenta en el README la ejecución sin Docker y los comandos de tests (`pytest`, `npm test`). | Media | D2 |
| **R21.** Mensajes de commit con Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`, `chore:`). | Baja | D3 |

### DX y tooling

| Regla | Prioridad | Base |
|---|---|---|
| **R22.** Activa `"strict": true` en `tsconfig.app.json` y `tsconfig.node.json`. | Alta | X1: 0 errores con `--strict` |
| **R23.** Fija versiones en `requirements.txt` y separa las de desarrollo (`requirements-dev.txt`). | Media | X2, X3 |
| **R24.** Declara la versión de Node (`"engines": {"node": ">=20.19"}` + `.nvmrc`). | Media | X4 |
| **R25.** Añade CI mínima que ejecute `pytest`, `npm test`, `npm run lint` y `tsc -b`. | Media | X5 |

---

## 7. Descartados

| Candidato | Motivo |
|---|---|
| "El código está bien organizado" / "es legible" | Vago, no apunta a nada verificable |
| "Faltan comentarios" | Vago; las funciones tienen nombres descriptivos |
| `StrictMode` hace dos `fetch` en desarrollo (`main.tsx` + `useEffect` sin cleanup) | Real pero inofensivo: solo ocurre en dev y no afecta al resultado |
| `ProfitPercentChart` muestra "No data" si todos los márgenes son exactamente 0 (`profit-percent-chart.tsx:65`) | Caso borde de comportamiento, no una convención; va mejor como issue |
| `CustomTooltip` y el skeleton de carga duplicados en los dos gráficos | Duplicación pequeña (~30 líneas); extraerla ahora no reduce riesgo |
| "Usar React Query / Zustand" | Opinión de stack sin hecho del repo que la exija |
