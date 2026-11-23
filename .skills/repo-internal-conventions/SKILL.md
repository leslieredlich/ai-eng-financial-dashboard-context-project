---
name: repo-internal-conventions
description: Apply project-specific patterns discovered in the financial dashboard codebase — data fetching with SWR, Docker healthchecks, timezone-safe aggregations, shadcn/ui conventions, and legacy code anti-patterns. Use for "apply internal conventions", "check dashboard patterns", "fix repo-specific issues", or "apply discovered rules".
license: MIT
metadata:
  author: financial-dashboard-team
  version: "1.0"
---

# Repo Internal Conventions

Skill interna que captura patrones y anti-patrones **específicos de este repositorio heredado** que las skills comunitarias no cubren. Estas reglas salieron de auditorías del codebase y fixes reales documentados en `memory-bank/` y `.agents/rules/`.

## Cuándo usarla

- Al tocar componentes del dashboard (KPICard, charts, header)
- Al modificar el backend o endpoints
- Al cambiar configs de Docker, Vite o TypeScript
- Al hacer data fetching o manejar estados asíncronos
- Al agregar o modificar archivos CSS/Tailwind

## Objetivo

Estandarizar las convenciones específicas de este proyecto que no están cubiertas por skills genéricas (accesibilidad, performance, React best practices). Cada regla aquí resuelve un problema real que encontramos en el codebase heredado.

## Inputs esperados

- Un clon del repo `ai-eng-financial-dashboard-context-project`
- Acceso a los archivos modificables del proyecto
- El comando de build (`npm run build`) para verificar

## Output esperado

- Código que sigue las convenciones internas del proyecto
- Cada cambio trazable a una regla de esta skill
- Build exitoso (`npm run build`) después de aplicar cambios

## Reglas

### 1. Data fetching con SWR (regla descubierta en auditoría)

**Contexto:** El dashboard original usaba `fetch` directo con `useEffect` y `useState`. Migramos a SWR para deduplicación automática de requests, caching y revalidación.

```tsx
// ✅ Patrón correcto (App.tsx)
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
});

function App() {
  const { data, error, isLoading } = useSWR<KPIMetrics>('/api/metrics', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
  });

  // ❌ No usar: loading/error vacíos, no discriminar entre error y datos vacíos
  // ✅ Correcto: discriminar los 3 estados
  if (error) return <div role="alert">Error: {error.message}</div>;
  if (isLoading) return <div>Loading...</div>;
  if (!data) return <div role="status">No data available</div>;
}
```

**Verificación:** `npm run build` sin errores. No debe haber `useEffect` + `fetch` en `App.tsx`.

### 2. Manejo de zona horaria (timezone-safe aggregations)

**Contexto:** El backend agrupa movimientos por mes (`strftime('%Y-%m', ...)`). Si no se fija la zona horaria, los datos de UTC (medianoche) pueden caer en el mes anterior para usuarios en GMT-3.

```python
# ✅ Patrón correcto (database.py)
from datetime import datetime, timezone

today = datetime.now(timezone.utc).strftime('%Y-%m')  # siempre UTC

# ❌ No usar: datetime.now() sin timezone — depende de la zona horaria del servidor
```

**Para tests:** Forzar UTC en `conftest.py`:
```python
# ✅ backend/tests/conftest.py
os.environ['TZ'] = 'UTC'
```

**Verificación:** `pytest` pasa. Los datos agrupados por mes son consistentes sin importar dónde corre el servidor.

### 3. Docker healthcheck y orden de arranque

**Contexto:** El backend debe estar listo antes de que el frontend intente conectarse. Descubrimos que sin healthcheck fallaba en el primer intento.

```yaml
# ✅ docker-compose.yml
services:
  backend:
    healthcheck:
      test: ["CMD", "python", "-c", "import http.client; c=http.client.HTTPConnection('localhost', 8000); c.request('GET', '/health'); assert c.getresponse().status == 200"]
      interval: 5s
      timeout: 5s
      retries: 10
      start_period: 10s
  frontend:
    depends_on:
      backend:
        condition: service_healthy  # ❌ No usar: solo depends_on sin condition
```

**Verificación:** `docker compose up -d` → backend `Healthy` antes de que frontend arranque.

### 4. shadcn/ui — cssVariables: false

**Contexto:** El `components.json` del proyecto tiene `"cssVariables": false`. Si un compañero genera un nuevo componente shadcn sin cambiar esto primero, el componente no usará los tokens del tema oscuro.

```bash
# ✅ ANTES de generar cualquier componente shadcn
# Editar frontend/components.json → "cssVariables": true
# Luego generar el componente
npx shadcn@latest add button

# ❌ No usar shadcn add sin verificar este setting
```

**Verificación:** `components.json` tiene `"cssVariables": true` antes de generar componentes nuevos.

### 5. CORS en backend — solo para desarrollo

**Contexto:** El backend tiene `CORSMiddleware(allow_origins=["*"], allow_credentials=True)`. Esto es útil para desarrollo standalone (frontend en :5173, backend en :8000), pero inseguro para producción.

```python
# ✅ Para desarrollo (main.py)
import os
origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, ...)

# ❌ No desplegar con allow_origins=["*"] si allow_credentials=True
```

**Verificación:** En Docker (proxy mismo origen), CORS no aplica. En standalone, solo se permiten los orígenes configurados en `CORS_ORIGINS`.

### 6. Convenciones de componentes — descubiertas en el codebase

```tsx
// ✅ Nombres de archivo en kebab-case
// dashboard-header.tsx, kpi-card.tsx

// ✅ Named exports (excepto App.tsx que usa default export)
export function KPICard({ title, value, ... }: KPICardProps)

// ✅ Iconos decorativos con aria-hidden
<Icon className="..." aria-hidden="true" />

// ✅ Estados: loading skeleton, error con role="alert", empty con role="status"
// ❌ No mostrar nada en loading/error/empty

// ✅ useMemo para datos derivados de props
const processedData = useMemo(() => computeMonthlyData(data), [data]);

// ✅ React.memo en componentes que reciben props complejas (charts, KPICard)
export default React.memo(IncomeOutcomeChart);
```

### 7. Backend — requirements.txt con versiones

**Contexto:** El `requirements.txt` original no tenía versiones fijas. Esto causaba builds inconsistentes.

```txt
# ✅ requirements.txt con versiones
fastapi==0.115.0
uvicorn[standard]==0.30.0
sqlalchemy==2.0.0
pytest==8.0.0
httpx==0.27.0
# ❌ No usar: fastapi (sin versión)
```

**Verificación:** `pip install -r requirements.txt` produce las mismas versiones siempre.

### 8. Eliminar recursos no usados

**Contexto:** Encontramos `hero.png` de 120 kB que no se usaba en ningún componente.

- Si un asset (imagen, fuente, SVG) no es referenciado por ningún archivo JSX/TSX/HTML, se puede eliminar.
- Verificar con: `grep -r "hero\.png" frontend/src/`
- **Verificación:** `npm run build` sigue pasando después de eliminar.

## Criterios de aceptación

- [ ] `npm run build` pasa sin errores
- [ ] `npm test` pasa (frontend)
- [ ] `pytest` pasa (backend)
- [ ] `docker compose up -d` funciona con healthcheck
- [ ] No hay `useEffect` + `fetch` en `App.tsx` (debe usar SWR)
- [ ] `components.json` tiene `"cssVariables": true`
- [ ] `backend/requirements.txt` tiene versiones fijas
- [ ] Todos los componentes siguen: kebab-case, named exports (excepto App), iconos decorativos con aria-hidden
- [ ] Los assets no referenciados están eliminados