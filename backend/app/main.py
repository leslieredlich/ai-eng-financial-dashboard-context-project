import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import router

app = FastAPI(title="Financial Metrics API")

# CORS: en Docker (proxy mismo origen) no aplica.
# En standalone: permite origenes desde variable de entorno, con fallback a localhost.
# ⚠️ No usar allow_origins=["*"] con allow_credentials=True en produccion.
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(router)
