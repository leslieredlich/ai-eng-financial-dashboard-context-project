import os
import sys
from pathlib import Path

# Fijar UTC para evitar desfases en agregaciones mensuales por zona horaria
os.environ.setdefault("TZ", "UTC")

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))
