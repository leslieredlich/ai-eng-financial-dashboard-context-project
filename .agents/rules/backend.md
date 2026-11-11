---
name: backend
description: Convenciones de la API FastAPI con datos mock — aleatoriedad aislada, filtros reutilizables, fechas relativas y CORS.
scope:
  - backend/app/**
---

# Backend (FastAPI)

## Alcance

`backend/app/main.py` (app y CORS) y `backend/app/routes.py` (modelos, generación de datos, lógica y endpoints).

## Por qué

No hay base de datos: cada request regenera 360 movimientos con `generate_mock_movements(seed=42)` (`routes.py:96`), relativos a `date.today()` (`routes.py:99`). Eso tiene tres consecuencias que no son obvias: la aleatoriedad debe estar aislada, las fechas cambian cada mes, y cada endpoint repite el mismo pipeline de filtrado.

## Guía

1. **(R2) No uses el `random` global.** Usa una instancia `random.Random(seed)` y pásala a los helpers (como `_build_movement(rng, …)`). Nunca llames a `random.seed()`: resetea el generador de todo el proceso.
   - Si tocas la generación, comprueba que los datos no cambian comparando un hash antes/después (ver *Cómo comprobar*), salvo que el cambio de datos sea intencional.
2. **(R6) No escribas fechas fijas sobre los datos mock.** El rango se desplaza cada mes (hoy: `2025-11-01 → 2026-10-28`). Obtén el rango con `build_metrics_facets()` / `GET /api/metrics/facets`.
3. **(R3) Un endpoint nuevo reutiliza las funciones puras** (`filter_movements`, `summarize_movements`, `build_top_categories`, `calculate_net_value`, `detect_outcome_alerts`) y solo orquesta. No metas lógica de negocio dentro de la función del endpoint.
   - Deuda conocida: el filtro por `business_type` está copiado en 4 endpoints (`routes.py:281, 299, 315, 354`). Si añades otro endpoint con ese filtro, muévelo a `filter_movements` en lugar de copiarlo una quinta vez.
4. **(R9) CORS:** `allow_origins=["*"]` con `allow_credentials=True` (`main.py:9-10`) solo es aceptable mientras no haya autenticación. Si se añade auth, sustitúyelo por una lista explícita de orígenes.
5. Todo endpoint declara `response_model` y valida parámetros con `Query(...)` y tipos `Literal`, como los existentes.

## Cómo comprobar

```bash
# desde backend/
.venv/bin/python -m pytest
# hash de los datos mock (debe coincidir antes y después de un refactor)
.venv/bin/python -c "import hashlib,json;from app.routes import generate_mock_movements as g;print(hashlib.sha256(json.dumps([m.model_dump(mode='json') for m in g(seed=42)]).encode()).hexdigest()[:16])"
```

## Validación

R2 aplicada: `generate_mock_movements` pasó a `random.Random(seed)`. El hash de datos fue idéntico antes y después (`833dda429661f374`), y el nuevo test `test_generate_mock_movements_does_not_reseed_global_random` falla con el código anterior. Detalle en `analysis/phase-3-rule-validation.md`.
