# Verificación — Fase 1: Comprender el handover

En esta fase recibí un proyecto que yo no había escrito y tuve que entenderlo antes de tocarlo. Trabajé con un agente de IA (Claude Code): le pedí que analizara el repo y me hiciera un resumen. Después contrastamos ese resumen con el código real, porque un resumen de IA sin comprobar es solo una suposición. Este documento es el rastro de esa revisión.

## 1. Cómo entiendo el proyecto

Es un dashboard financiero de una sola página. Tiene dos partes que corren por separado:

| Pieza | Stack | Puerto | Dónde arranca |
|---|---|---|---|
| Frontend | React 19 + TypeScript + Vite 8 + Tailwind 4 + Recharts | 5173 | `index.html` → `src/main.tsx` → `src/App.tsx` |
| Backend | FastAPI + Uvicorn (en Docker lo lanza `debugpy`) | 8000 (depuración en 5678) | `app/main.py` → `router` de `app/routes.py` |

**De dónde salen los datos:** no hay base de datos. Cada vez que alguien pide datos, el backend inventa 360 movimientos (30 por mes durante 12 meses) con una semilla fija (`42`), así que el mismo día siempre salen los mismos datos.

**El recorrido de un dato, de principio a fin:**

1. Abro `localhost:5173` en el navegador y Vite me entrega la página de React.
2. `App.tsx` pide los datos a `/api/metrics`.
3. Esa petición llega a Vite, que no tiene datos propios. Como empieza por `/api`, su **proxy** la reenvía al backend en el puerto 8000.
4. FastAPI genera los movimientos y los devuelve en JSON.
5. Vite le pasa la respuesta al navegador y `src/lib/financial-utils.ts` calcula los KPIs y los totales por mes que se ven en pantalla.

Por eso `localhost:8000/health` responde `{"status":"ok"}` y `localhost:5173/health` no: el proxy de Vite solo reenvía las rutas que empiezan por `/api`. Cualquier otra ruta la responde Vite con la página de React.

**Endpoints del backend:** `/health`, `/api/metrics` y `/api/metrics/{b2b, b2c, facets, summary, categories/top, comparison, alerts}`. El frontend solo usa `/api/metrics`.

**Cómo se ejecuta:**
- Con Docker: `docker compose up --build`.
- Sin Docker: en `backend/`, un entorno virtual `.venv` y `uvicorn`; en `frontend/`, `npm install` y `npm run dev`. Requiere Node ≥ 20.19.

## 2. Qué dijo el resumen y qué era verdad

✅ correcto · ❌ incorrecto · ❓ no verificable o desactualizado · ⚠️ incompleto

| Lo que decía el resumen | Estado | Cómo lo comprobamos / qué era en realidad |
|---|---|---|
| `main.py` crea la app, configura CORS y registra el router | ✅ | Se ve en `backend/app/main.py` |
| Hay 10 endpoints | ❌ | Son **9** (`grep -c "@router.get" backend/app/routes.py`). Este error se nos pasó en la Fase 1 y lo detectamos en la Fase 4, al construir `memory-bank/` |
| El front solo usa `/api/metrics` | ✅ | Hay un único `fetch` en `App.tsx` |
| `index.html` → `main.tsx` → `App.tsx` | ✅ | `index.html:11` carga `main.tsx` |
| Hay 5 componentes de dashboard y 2 de ui | ✅ | Carpeta `src/components/` |
| `lib/` tiene tipos, cálculos y mock-data | ⚠️ | Faltaban `utils.ts` (la función `cn()`) y `financial-utils.test.ts` |
| `mock-data.ts` no se usa | ✅ | Ningún archivo lo importa, así que lo eliminamos |
| El backend arranca con `uvicorn --reload` | ⚠️ | En Docker lo arranca `debugpy`, que a su vez lanza uvicorn |
| "El frontend arranca después del backend" | ⚠️ | `depends_on` solo esperaba a que el contenedor arrancara, no a que la API respondiera. Añadimos un healthcheck |
| Los números de línea del primer resumen | ❌ | Venían de un volcado de varios archivos juntos, no del archivo real. Los corregimos |
| El título dice "2024 - Full Year" | ❓ | Ya había cambiado, pero seguía siendo texto fijo. Ahora se calcula a partir de los datos |
| El proyecto corre en local sin Docker | ❌ | El proxy apuntaba siempre a `backend:8000`, un nombre que solo existe dentro de Docker. Lo hicimos configurable |

Lo que me llevo de esta tabla: la IA acertó en lo general, pero se equivocó en detalles concretos (el número de endpoints, las líneas). Esos detalles son justo los que más confunden a quien llega después.

## 3. Problemas que encontramos y cómo los corregimos

| Problema | Por qué pasaba | Corrección |
|---|---|---|
| Los movimientos del día 1 se contaban en el mes anterior | `new Date("2025-11-01")` se interpreta como medianoche en UTC. En Chile (UTC-3) eso es el 31 de octubre a las 21:00 | El mes se lee directamente del texto (`"2025-11-01".slice(0, 7)` → `"2025-11"`), sin convertir a fecha. Añadimos un test |
| El periodo del encabezado estaba escrito a mano | Era texto fijo en el componente | `formatPeriodLabel()` lo calcula a partir de los datos. Añadimos tests |
| El frontend arrancaba antes de que la API respondiera | `depends_on` no espera a que el servicio esté listo | Healthcheck sobre `/health` y `condition: service_healthy` |
| El proyecto no corría sin Docker | El proxy de Vite apuntaba fijo a `http://backend:8000` | Variable `API_PROXY_TARGET`: Docker la define y, si no existe, se usa `localhost:8000` |
| Había código muerto | `mock-data.ts` no lo usaba nadie | Eliminado |

## 4. Comprobaciones ejecutadas

- Frontend: `tsc -b`, `npm test` (8/8) y `npm run lint`, sin errores.
- Backend: `pytest` (15/15 en esta fase).
- Docker: el backend queda `healthy` antes de que arranque el frontend, y `GET /api/metrics` a través del proxy responde 200.
- Bug de zona horaria: lo reproducimos con `TZ` en UTC-3. Antes el movimiento caía en `2025-10`; después, en `2025-11`.

Algo que entendí más tarde: el primer test de zona horaria pasaba siempre dentro de Docker, porque Docker corre en UTC y ahí el bug no aparece. Un test que no puede fallar no protege nada. Por eso en la Fase 3 fijamos la zona horaria de los tests (regla R16).

## 5. Pendientes que dejé fuera de esta fase

- `requirements.txt` no fija versiones, así que cada instalación puede traer versiones distintas.
- 8 de los 9 endpoints del backend no los usa el frontend.
- El contenedor del backend siempre corre en modo desarrollo (`--reload` + `debugpy`).

## 6. Mi revisión personal

- Fecha: 2026-11-11
- Qué comprobé por mi cuenta:
  - Abrí http://localhost:8000/docs y vi la documentación de los endpoints de la API.
  - Abrí http://localhost:5173 y vi el dashboard con los KPIs y los gráficos cargando datos del backend.
  - Levanté el backend sin Docker. Mi primer `pip install` se instaló en el Python global en vez de en el `.venv`; con el agente detectamos el problema y dejamos las dependencias en el `.venv` para arrancar `uvicorn`.
  - Me encontré con el bloqueo de PowerShell al activar el `.venv` y al usar `npm`, y lo resolví cambiando la política de ejecución.
  - Levanté el frontend con `npm install` y `npm run dev`.
  - Revisé en GitHub que cada fase tuviera su commit, e hice yo el merge y el push de cada una.
  - Leí y verifiqué los documentos de las fases 1 a 4 y del memory-bank.
- Algo que corregí o con lo que no estuve de acuerdo:
  - Al rehacer este documento, entendí que mi primera idea de `/health` estaba incompleta: el frontend sí recibe datos del backend, pero el proxy solo reenvía las rutas que empiezan por `/api`.
---

# Verificación — Specs del frontend, Fase 1: Explorar la API

- Fecha: 2026-11-12 · Rama: `feature/frontend-specs` (sale de `main` en `16c53b7`).
- Arranqué el backend sin Docker (`.venv` + `uvicorn --reload`). `GET /health` respondió `{"status":"ok"}` y abrí `/docs`.
- Leí `openapi.json` y `backend/app/routes.py`: hay 8 endpoints de métricas y la UI solo usa `/api/metrics` (`App.tsx:20`).
- Llamé a cada endpoint con `curl` y confirmé las formas de respuesta y los casos borde:
  - `/comparison` sin fechas → `422`. Con un rango sin datos (2024-01) → `delta_pct: null`.
  - `/alerts?threshold=30` → `[]`, porque el umbral es una proporción (`0.3` = 30 %).
  - `/categories/top` → 4 categorías de gasto aunque `limit` sea 5. `limit=50` → `422`.
  - `business_type=b2b` → `422`; solo acepta `B2B` o `B2C`.
  - `/summary?group_by=week` del 2026-10-01 al 2026-10-14 → semanas ISO `W40`–`W42`, incompletas en los bordes.
- Contrasté las tres funcionalidades del PM con la API en vivo (✅ verificada en `/docs` / ❌ incorrecta / ❓ sin verificar):
  - F1 ❌ "extender el endpoint de métricas": `/api/metrics` ya acepta `start_date` y `end_date`. Ojo: `start_date=` vacío → `422`, así que un input vacío no se envía.
  - F2 ❌ "media móvil de 3 períodos": `baseline_average` es el promedio de todos los periodos anteriores (2026-03: 55334.29; la media de 3 sería 59977.58).
  - F2 ❌ "umbral entre 0.01 y 1.0": la API acepta cualquier valor ≥ 0 sin máximo (`1.5` → `[]`, `-0.1` → `422`). Lo valida la UI.
  - F3 ❌ "top 5 de ingresos": solo existen 2 categorías de ingreso (`sales`, `others`).
  - F3 ❌ "categorías por grupo desde facetas": `/facets?business_type=B2B` devuelve lo mismo que sin filtro.
  - F3 ❌ endpoint del PM sin `business_type`: devuelve B2B y B2C sumados (`sales` 1132097.38). Hay que hacer una llamada por línea.
  - F3 ❓ "nueva página": el frontend no tiene router.
- Segunda pasada con las reglas del frontend y más casos borde:
  - Los límites de fecha son inclusivos (`start_date=end_date=2026-10-02` → 1 movimiento) y funcionan por separado.
  - Bordes del umbral del PM: `0.01` → 5 alertas, `1.0` → 1 alerta; `abc` → `422`.
  - En `/docs`, todos los campos de `MetricsFacets`, `MetricsAlert` y `TopCategoryItem` son obligatorios.
  - Las specs deben usar textos de UI en inglés (R13), el vocabulario `outcome` (R12) y fechas como texto, no con `new Date()`.
- Resolví cada desajuste en la spec, no en el código. Quedan 4 preguntas abiertas para el PM.

# Verificación — Specs del frontend, Fase 2: Tipos TypeScript

- Fecha: 2026-11-12. Archivos: `frontend/specs/api-types.ts` y `frontend/specs/param-types.ts`.
- Nombres de `/docs` → nombres de la spec: `MetricsFacets` → `FacetsResponse`, `MetricsAlert` → `AlertEntry`, `TopCategoryItem` → `CategoryEntry`.
- Los enums (`OperationType`, `Category`, `BusinessType`) se importan de `src/lib/financial-types.ts`, que `test_contract.py` mantiene sincronizado con el backend. No se copian por tercera vez.
- Comparé cada interfaz con `GET /openapi.json` usando un script: mismos campos, mismo tipo y misma obligatoriedad → 0 fallas. Para probar el script, sembré 3 errores en una copia (un tipo cambiado, un campo opcional y un nombre cambiado) y detectó los 3.
- Omisiones a propósito, documentadas en JSDoc: `business_type` en `AlertsParams` y `category` en `DateRangeFilter` (ninguna funcionalidad los usa).
- `tsc --strict` (con las mismas opciones de `tsconfig.app.json`) y `eslint specs` pasan sin errores. No hay `any` ni `object`.
- Cada propiedad tiene JSDoc con significado, valores válidos y formato. Los valores citados (`2025-11-01`, `0.5917`, `55334.29`) salen de llamadas reales.

# Verificación — Specs del frontend, Fase 3: Componentes

- Fecha: 2026-11-12. Archivos: `frontend/specs/components.md` y `frontend/specs/component-props.ts`.
- Antes de escribir, leí los componentes existentes (`income-outcome-chart.tsx`, `kpi-card.tsx`, `kpi-row.tsx`, `dashboard-header.tsx`) para copiar sus patrones: props con `loading?`, `Card` + `Skeleton` mientras carga y un mensaje centrado si no hay datos.
- Las props de los 8 componentes nuevos están escritas en TypeScript y usan los tipos de la Fase 2. `tsc --strict` y `eslint specs` pasan, sin `any` ni `object`.
- Resolví 7 ambigüedades del brief en una tabla de decisiones. Entre ellas: vista por hash en vez de router, un solo rango de fechas compartido y la etiqueta honesta de `baseline_average`.
- Comprobé los ejemplos del documento con las funciones de formato del repo (`formatCurrency`, `formatPercent`, `toLocaleDateString`): `$88,077`, `59.2%`, `30.0%`, `90.6%`, `$615,541`, `Mar 2026`. También comprobé que los tokens `--chart-1` y `--chart-4` existen en `:root` y en `.dark`.

# Verificación — Specs del frontend, Fase 4: Contrato de datos

- Fecha: 2026-11-12. Archivos: `frontend/specs/README.md`, `frontend/specs/api-contract.ts` y `frontend/specs/tsconfig.json`.
- Volví a leer `/openapi.json` en vivo: los 4 endpoints (`/facets`, `/api/metrics`, `/alerts`, `/categories/top`) tienen los parámetros, valores por defecto, mínimos y máximos que dice el README. El script de comparación contra OpenAPI da 0 fallas.
- Repetí con `curl` cada caso borde del README, 26 llamadas en total. Algunos resultados: `?start_date=` → 422, inicio > fin → `[]`, solo `start_date=2026-10-01` → 30 movimientos, umbral `0.3` → 4 alertas, `0.01` → 5, `1` → 1, `1.5` → `[]`, B2B en octubre de 2026 → 1 categoría, `b2b` → 422, `limit=0` o `21` → 422.
- Cada funcionalidad tiene entre 6 y 8 casos borde, cada uno con lo que muestra la UI.
- Agregué `api-contract.ts`, que une cada endpoint con su tipo de request y de response, y tipa el error 422 sin `any`.
- `npx tsc --noEmit` a secas no revisaba nada: el `tsconfig.json` raíz tiene `"files": []`. Agregué `specs/tsconfig.json`, que hereda las reglas de la app. Con él, `npx tsc --noEmit -p specs` compila los 4 `.ts`. `eslint specs` y `tsc -b` de la app también pasan.
- Un script comprueba que los 12 tipos copiados en el README son idénticos a los de los `.ts`.
- Corregí en `components.md` la nota de F3 con 1 sola categoría, que quedaba "1 income categories": ahora va en singular.
- Revisé el README pensando en una sesión nueva sin contexto e hice 3 ajustes para que no tenga que preguntar:
  - Agregué una tabla de qué existe y qué se crea, con el archivo y la firma de cada función nueva.
  - Cambié ❓ por 📐 (decisión de spec ya cerrada) en el manejo de errores.
  - Dejé explícito que `dateRange` es un solo estado en `App.tsx`, compartido por las dos vistas.
