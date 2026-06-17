"""Tiny JSON-file storage layer for the APFB prototype.

State lives in a single JSON document on disk so the prototype survives restarts
without needing a real database. All access goes through `load` / `save`.
"""
from __future__ import annotations

import json
import os
import threading
from typing import Any

_DIR = os.path.join(os.path.dirname(__file__), "data")
_PATH = os.path.join(_DIR, "store.json")
_LOCK = threading.Lock()


def _ensure_dir() -> None:
    os.makedirs(_DIR, exist_ok=True)


def load() -> dict[str, Any]:
    _ensure_dir()
    if not os.path.exists(_PATH):
        from seed import build_seed

        save(build_seed())
    with open(_PATH, "r", encoding="utf-8") as fh:
        return json.load(fh)


def save(state: dict[str, Any]) -> None:
    _ensure_dir()
    with _LOCK:
        tmp = _PATH + ".tmp"
        with open(tmp, "w", encoding="utf-8") as fh:
            json.dump(state, fh, indent=2, default=str)
        os.replace(tmp, _PATH)


def reset() -> dict[str, Any]:
    """Wipe the store and reseed (used by the Administration page)."""
    from seed import build_seed

    state = build_seed()
    save(state)
    return state
