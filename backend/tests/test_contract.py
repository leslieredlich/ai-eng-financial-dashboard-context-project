"""Backend and frontend declare the domain enums by hand in two places.

This test fails when they drift apart (rule: .agents/rules/domain-contract.md).
"""

import re
from pathlib import Path
from typing import get_args

import pytest

from app.routes import BusinessType, Category, OperationType

FRONTEND_TYPES = (
    Path(__file__).resolve().parents[2] / "frontend" / "src" / "lib" / "financial-types.ts"
)


def _frontend_union(type_name: str) -> set[str]:
    source = FRONTEND_TYPES.read_text(encoding="utf-8")
    match = re.search(rf"export type {type_name} =([^\n]+)", source)
    assert match, f"{type_name} not found in {FRONTEND_TYPES.name}"
    return set(re.findall(r"['\"]([^'\"]+)['\"]", match.group(1)))


@pytest.mark.skipif(
    not FRONTEND_TYPES.exists(),
    reason="frontend/ is not available (e.g. inside the backend container)",
)
@pytest.mark.parametrize(
    ("type_name", "backend_type"),
    [
        ("OperationType", OperationType),
        ("Category", Category),
        ("BusinessType", BusinessType),
    ],
)
def test_domain_enums_match_frontend(type_name, backend_type):
    assert _frontend_union(type_name) == set(get_args(backend_type))
