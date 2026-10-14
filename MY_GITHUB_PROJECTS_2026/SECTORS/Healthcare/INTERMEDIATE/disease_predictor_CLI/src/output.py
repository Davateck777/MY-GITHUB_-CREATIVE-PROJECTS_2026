"""Presentation helpers for CLI output."""

from __future__ import annotations

import json
from typing import Any


def json_text(payload: Any) -> str:
    return json.dumps(payload, indent=2, sort_keys=True)


def banner(title: str) -> str:
    return f"\n{title}\n{'=' * len(title)}"
