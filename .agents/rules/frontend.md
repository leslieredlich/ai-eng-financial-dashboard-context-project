---
name: frontend
description: Convenciones del dashboard React — dónde va la lógica, cómo llamar a la API, estilos con tokens, componentes shadcn, naming e idioma.
scope:
  - frontend/src/**
---

# Frontend (React + Vite)

## Alcance

Todo `frontend/src/`: `App.tsx`, `components/dashboard/`, `components/ui/`, `lib/` e `index.css`.

## Por qué

La app es pequeña y hoy está ordenada: `App.tsx` obtiene los datos, `lib/financial-utils.ts` calcula, y los componentes solo pintan. Estas reglas evitan que ese orden se pierda con el siguiente cambio.

## Guía

### Estructura

1. **(R4) Los cálculos van en funciones puras de `src/lib/`, con su test.** Los componentes reciben datos ya calculados por props (como `KPIRow`, que recibe `metrics`) y no hacen `fetch` ni agregaciones.
2. **(R5) Llamadas a la API:** hoy solo `App.tsx:19-25` hace `fetch` a `/api/metrics`. Si consumes un segundo endpoint, primero mueve los `fetch` a `src/lib/api.ts`, usando `import.meta.env.VITE_API_BASE_URL ?? ""` como base. Usa rutas relativas (`/api/...`): el proxy de Vite las resuelve.

### Estilos y componentes

3. **(R7) Colores solo con tokens.** Un color nuevo se define en `src/index.css` **dos veces**, en `:root` (claro) y en `.dark` (oscuro), y se usa con `var(--nombre)`. Sin hex ni `oklch()` dentro de componentes. La app fuerza el tema oscuro (`App.tsx`, `className="dark"`), pero ambos bloques deben existir.
4. **(R8) `components/ui/` es código de shadcn.** No lo edites a mano para casos particulares; personaliza con `className` desde el componente que lo usa. Antes de generar un componente nuevo con el CLI, cambia `"cssVariables": false` a `true` en `components.json`; si no, el componente no usará los tokens del tema.

### Naming e idioma

5. **(R10)** Archivos en `kebab-case.tsx`; componentes en `PascalCase` con **named export** (`export function KPICard`). Solo `App.tsx` usa `export default`. Imports internos con el alias `@/` (`@/lib/...`, `@/components/...`).
6. **(R13) Todo texto visible al usuario va en inglés**, incluidos los mensajes de error, estados vacíos y tooltips.

## Cómo comprobar

```bash
# desde frontend/
npx tsc -b && npm run lint && npm test
# no debe devolver nada (textos de UI en español)
grep -rnE "[áéíóúñ¿¡]" src --include=*.tsx
```

## Validación

R13 aplicada: el mensaje de error de `App.tsx` (único texto en español) pasó a inglés; el `grep` quedó vacío y `tsc`, lint y tests pasan. Detalle en `analysis/phase-3-rule-validation.md`.
