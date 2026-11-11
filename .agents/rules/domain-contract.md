---
name: domain-contract
description: Mantener sincronizados los tipos del dominio entre backend y frontend, y respetar nombres de campos y vocabulario.
scope:
  - backend/app/routes.py
  - frontend/src/lib/financial-types.ts
---

# Contrato del dominio

## Alcance

Cualquier cambio en los valores de `OperationType`, `Category` o `BusinessType`, en los campos de `FinancialMovement`, o en los nombres de conceptos financieros.

## Por qué

No hay tipos generados: el backend declara los enums con `Literal[...]` (`backend/app/routes.py:11-14`) y el frontend los repite a mano (`frontend/src/lib/financial-types.ts:1-3`). TypeScript no puede ver el backend, así que un desajuste no da error de compilación: el front simplemente recibe valores que no conoce.

## Guía

1. **(R1) Cambia los enums en los dos archivos en el mismo commit.** `backend/tests/test_contract.py` compara ambos y falla si difieren.
   - Ese test se **omite** dentro del contenedor backend (solo monta `backend/`). Ejecuta `pytest` desde el repo completo antes de hacer commit.
2. **(R11) No renombres campos de la API en el tipo de entrada.** `FinancialMovement` conserva `snake_case` (`create_date`, `operation_type`) tal como llega del backend. Usa `camelCase` solo en tipos que el front deriva (`KPIMetrics.totalIncome`, `MonthlyDataPoint.profitPercent`).
3. **(R12) Usa el vocabulario existente:** `income`, `outcome`, `net`, `profit`, `profitPercent`. No introduzcas `expense`, `revenue`, `cost` ni sinónimos: `outcome` ya aparece en la API, los tipos, la variante de `KPICard` y los tokens CSS (`--chart-outcome`).

## Cómo comprobar

```bash
# desde backend/, con el repo completo
.venv/bin/python -m pytest tests/test_contract.py
```

## Validación

Se añadió `test_contract.py`; se simuló un desajuste añadiendo `'taxes'` solo en el frontend y el test falló con `Extra items in the left set`. Detalle en `analysis/phase-3-rule-validation.md`.
