# Reglas del repositorio

Reglas para personas y agentes que contribuyen a este repo. Cada archivo indica a qué rutas aplica, por qué existe y cómo comprobar que se cumple.

| Archivo | Aplica a | Resumen |
|---|---|---|
| [domain-contract.md](domain-contract.md) | `backend/app/routes.py`, `frontend/src/lib/financial-types.ts` | Tipos del dominio sincronizados, nombres de campos y vocabulario |
| [backend.md](backend.md) | `backend/app/**` | Datos mock deterministas, filtros reutilizables, fechas relativas, CORS |
| [frontend.md](frontend.md) | `frontend/src/**` | Lógica en `lib/`, capa de API, tokens de color, shadcn, naming, idioma |
| [testing.md](testing.md) | `backend/tests/**`, `frontend/src/**/*.test.ts(x)` | Tests que prueban algo real, zona horaria fija, ubicación |
| [tooling.md](tooling.md) | configuración, dependencias, CI | TypeScript estricto, versiones de Node y Python, formato |
| [docs-and-commits.md](docs-and-commits.md) | `README*.md`, `AGENTS.md`, historial de git | README bilingüe, rutas de agentes, Conventional Commits |

**Antes de dar por terminado un cambio**, ejecuta:

```bash
# backend/
.venv/bin/python -m pytest            # Windows: .venv\Scripts\python -m pytest
# frontend/
npx tsc -b && npm run lint && npm test
```

Los identificadores `R1`…`R25` remiten a los hallazgos de [analysis/phase-2-findings.md](../../analysis/phase-2-findings.md). La validación de cada regla está en [analysis/phase-3-rule-validation.md](../../analysis/phase-3-rule-validation.md).
